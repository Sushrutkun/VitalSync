package runner

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sync"
	"sync/atomic"
	"time"

	"github.com/vitalsync/loadgen/internal/api"
	"github.com/vitalsync/loadgen/internal/config"
	"github.com/vitalsync/loadgen/internal/sim"
)

type Runner struct {
	cfg    config.Config
	client *api.Client

	sent      atomic.Int64
	failed    atomic.Int64
	sessions  atomic.Int64 // successful auth count
	authFails atomic.Int64

	startedAt time.Time
}

func New(cfg config.Config) *Runner {
	return &Runner{
		cfg:    cfg,
		client: api.NewClient(cfg.BaseURL, cfg.RequestTimeout),
	}
}

func (r *Runner) Run(ctx context.Context) error {
	r.startedAt = time.Now()
	users := make([]*sim.UserSimulator, r.cfg.Users)
	for i := 0; i < r.cfg.Users; i++ {
		users[i] = sim.NewUserSimulator(i)
	}

	log.Printf("loadgen start: users=%d days=%d window-min=%d total-snapshots=%d concurrency=%d dry-run=%v",
		r.cfg.Users, r.cfg.Days, r.cfg.WindowMinutes, r.cfg.TotalSnapshots(), r.cfg.Concurrency, r.cfg.DryRun)

	if r.cfg.DryRun {
		return r.dryRun(ctx, users)
	}

	if err := r.authenticateAll(ctx, users); err != nil {
		return fmt.Errorf("auth phase: %w", err)
	}
	log.Printf("auth phase done: sessions=%d failures=%d", r.sessions.Load(), r.authFails.Load())

	if r.sessions.Load() == 0 {
		return errors.New("no users authenticated; aborting")
	}

	progressDone := r.startProgressLogger(ctx)
	defer func() {
		close(progressDone)
	}()

	r.syncPhase(ctx, users)
	r.printSummary()
	return nil
}

func (r *Runner) authenticateAll(ctx context.Context, users []*sim.UserSimulator) error {
	sem := make(chan struct{}, 20) // bounded auth concurrency
	var wg sync.WaitGroup

	for _, u := range users {
		u := u
		wg.Add(1)
		sem <- struct{}{}
		go func() {
			defer wg.Done()
			defer func() { <-sem }()

			session, err := r.authenticateUser(ctx, u)
			if err != nil {
				r.authFails.Add(1)
				log.Printf("auth failed user=%s: %v", u.Email, err)
				return
			}
			u.UserID = session.User.ID
			storeToken(u, session.AccessToken)
			r.sessions.Add(1)
		}()
	}
	wg.Wait()
	return ctx.Err()
}

// authenticateUser tries signup first; on conflict (existing account) falls
// back to login so re-runs are idempotent against the same backend.
func (r *Runner) authenticateUser(ctx context.Context, u *sim.UserSimulator) (*api.AuthResponse, error) {
	signupReq := api.SignupRequest{Email: u.Email, Password: u.Password, Name: u.Name}
	resp, err := r.client.Signup(ctx, signupReq)
	if err == nil {
		return resp, nil
	}
	if !errors.Is(err, api.ErrUserExists) {
		// Try login anyway in case the backend returned 400/422 for already-existing
		// user with a non-409 status; if login fails we surface the original error.
		loginResp, lerr := r.client.Login(ctx, api.LoginRequest{Email: u.Email, Password: u.Password})
		if lerr == nil {
			return loginResp, nil
		}
		return nil, err
	}
	return r.client.Login(ctx, api.LoginRequest{Email: u.Email, Password: u.Password})
}

func (r *Runner) syncPhase(ctx context.Context, users []*sim.UserSimulator) {
	sem := make(chan struct{}, r.cfg.Concurrency)
	var wg sync.WaitGroup

	now := time.Now().UTC()
	backfillStart := now.Add(-time.Duration(r.cfg.Days) * 24 * time.Hour).Truncate(24 * time.Hour)
	windowDur := time.Duration(r.cfg.WindowMinutes) * time.Minute
	totalWindows := r.cfg.Days * r.cfg.WindowsPerDay()

	for _, u := range users {
		u := u
		token := loadToken(u)
		if token == "" {
			continue // auth failed for this user; skip
		}
		wg.Add(1)
		go func() {
			defer wg.Done()
			r.runUser(ctx, sem, u, token, backfillStart, windowDur, totalWindows)
		}()
	}
	wg.Wait()
}

// runUser walks one user forward in time, sequentially, so the per-day step
// accumulator stays consistent. Each per-window HTTP call grabs a slot from
// the shared semaphore so total cross-user concurrency is bounded.
func (r *Runner) runUser(
	ctx context.Context,
	sem chan struct{},
	u *sim.UserSimulator,
	token string,
	backfillStart time.Time,
	windowDur time.Duration,
	totalWindows int,
) {
	for w := 0; w < totalWindows; w++ {
		if ctx.Err() != nil {
			return
		}
		periodStart := backfillStart.Add(time.Duration(w) * windowDur)
		periodEnd := periodStart.Add(windowDur)
		req := u.NextSnapshot(periodStart, periodEnd)

		select {
		case sem <- struct{}{}:
		case <-ctx.Done():
			return
		}
		r.sendOnce(ctx, token, req)
		<-sem
	}
}

func (r *Runner) sendOnce(ctx context.Context, token string, req api.HealthSyncRequest) {
	const maxAttempts = 2
	var lastErr error
	for attempt := 0; attempt < maxAttempts; attempt++ {
		_, err := r.client.SyncHealth(ctx, token, req)
		if err == nil {
			r.sent.Add(1)
			return
		}
		lastErr = err
		var httpErr *api.HTTPError
		if errors.As(err, &httpErr) && httpErr.Status >= 500 {
			time.Sleep(150 * time.Millisecond)
			continue
		}
		break
	}
	r.failed.Add(1)
	if r.failed.Load() <= 5 {
		log.Printf("sync failed user=%s key=%s err=%v", req.UserID, req.IdempotencyKey, lastErr)
	}
}

func (r *Runner) startProgressLogger(ctx context.Context) chan struct{} {
	done := make(chan struct{})
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-done:
				return
			case <-ticker.C:
				sent := r.sent.Load()
				failed := r.failed.Load()
				elapsed := time.Since(r.startedAt).Seconds()
				rate := float64(sent) / elapsed
				log.Printf("progress sent=%d failed=%d (%.1f msg/s, %.0fs elapsed)",
					sent, failed, rate, elapsed)
			}
		}
	}()
	return done
}

func (r *Runner) printSummary() {
	elapsed := time.Since(r.startedAt).Seconds()
	sent := r.sent.Load()
	failed := r.failed.Load()
	rate := float64(sent) / elapsed
	log.Printf("DONE sent=%d failed=%d in %.1fs (%.1f msg/s, target=%d)",
		sent, failed, elapsed, rate, r.cfg.TotalSnapshots())
}

// dryRun emits the first 5 snapshots per user as JSON to stdout (no HTTP).
func (r *Runner) dryRun(ctx context.Context, users []*sim.UserSimulator) error {
	now := time.Now().UTC()
	backfillStart := now.Add(-time.Duration(r.cfg.Days) * 24 * time.Hour).Truncate(24 * time.Hour)
	windowDur := time.Duration(r.cfg.WindowMinutes) * time.Minute
	maxPerUser := 20
	totalWindows := r.cfg.Days * r.cfg.WindowsPerDay()
	if maxPerUser > totalWindows {
		maxPerUser = totalWindows
	}

	enc := json.NewEncoder(jsonStdout{})
	enc.SetIndent("", "  ")

	for _, u := range users {
		u.UserID = u.Email // dry run: stand in for real userId
		log.Printf("--- user=%s persona=%s ---", u.Email, u.Persona.Name)
		for w := 0; w < maxPerUser; w++ {
			if ctx.Err() != nil {
				return ctx.Err()
			}
			periodStart := backfillStart.Add(time.Duration(w) * windowDur)
			periodEnd := periodStart.Add(windowDur)
			req := u.NextSnapshot(periodStart, periodEnd)
			if err := enc.Encode(req); err != nil {
				return err
			}
		}
	}
	return nil
}

// per-user token storage avoids exposing tokens in shared structures.
var tokenMu sync.RWMutex
var tokens = map[*sim.UserSimulator]string{}

func storeToken(u *sim.UserSimulator, token string) {
	tokenMu.Lock()
	defer tokenMu.Unlock()
	tokens[u] = token
}

func loadToken(u *sim.UserSimulator) string {
	tokenMu.RLock()
	defer tokenMu.RUnlock()
	return tokens[u]
}

// jsonStdout decouples encoder from package os without importing it twice.
type jsonStdout struct{}

func (jsonStdout) Write(p []byte) (int, error) { return stdoutWriter.Write(p) }
