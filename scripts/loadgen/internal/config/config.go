package config

import (
	"flag"
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	BaseURL        string
	Users          int
	Days           int
	WindowMinutes  int
	Concurrency    int
	RequestTimeout time.Duration
	DryRun         bool
}

func Parse(args []string) (Config, error) {
	fs := flag.NewFlagSet("loadgen", flag.ContinueOnError)

	cfg := Config{
		BaseURL:        envOrDefault("BASE_URL", "http://localhost:8083"),
		Users:          envIntOrDefault("USERS", 1000),
		Days:           envIntOrDefault("DAYS", 30),
		WindowMinutes:  envIntOrDefault("WINDOW_MINUTES", 60),
		Concurrency:    envIntOrDefault("CONCURRENCY", 100),
		RequestTimeout: envDurationOrDefault("REQUEST_TIMEOUT", 10*time.Second),
		DryRun:         envBoolOrDefault("DRY_RUN", false),
	}

	fs.StringVar(&cfg.BaseURL, "base-url", cfg.BaseURL, "backend base URL")
	fs.IntVar(&cfg.Users, "users", cfg.Users, "number of synthetic users")
	fs.IntVar(&cfg.Days, "days", cfg.Days, "backfill window in days")
	fs.IntVar(&cfg.WindowMinutes, "window-minutes", cfg.WindowMinutes, "snapshot window size in minutes")
	fs.IntVar(&cfg.Concurrency, "concurrency", cfg.Concurrency, "max in-flight HTTP requests")
	fs.DurationVar(&cfg.RequestTimeout, "request-timeout", cfg.RequestTimeout, "per-request timeout")
	fs.BoolVar(&cfg.DryRun, "dry-run", cfg.DryRun, "print first 5 snapshots/user, skip HTTP")

	if err := fs.Parse(args); err != nil {
		return Config{}, err
	}

	if err := cfg.validate(); err != nil {
		return Config{}, err
	}
	return cfg, nil
}

func (c Config) validate() error {
	if c.Users < 1 {
		return fmt.Errorf("users must be >= 1, got %d", c.Users)
	}
	if c.Days < 1 {
		return fmt.Errorf("days must be >= 1, got %d", c.Days)
	}
	if c.WindowMinutes < 1 || c.WindowMinutes > 1440 {
		return fmt.Errorf("window-minutes must be in [1,1440], got %d", c.WindowMinutes)
	}
	if 1440%c.WindowMinutes != 0 {
		return fmt.Errorf("window-minutes (%d) must divide 1440 evenly", c.WindowMinutes)
	}
	if c.Concurrency < 1 {
		return fmt.Errorf("concurrency must be >= 1, got %d", c.Concurrency)
	}
	if c.RequestTimeout < time.Second {
		return fmt.Errorf("request-timeout must be >= 1s, got %s", c.RequestTimeout)
	}
	if c.BaseURL == "" {
		return fmt.Errorf("base-url required")
	}
	return nil
}

func (c Config) WindowsPerDay() int {
	return 1440 / c.WindowMinutes
}

func (c Config) TotalSnapshots() int {
	return c.Users * c.Days * c.WindowsPerDay()
}

func envOrDefault(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func envIntOrDefault(key string, def int) int {
	if v := os.Getenv(key); v != "" {
		n, err := strconv.Atoi(v)
		if err == nil {
			return n
		}
	}
	return def
}

func envBoolOrDefault(key string, def bool) bool {
	if v := os.Getenv(key); v != "" {
		b, err := strconv.ParseBool(v)
		if err == nil {
			return b
		}
	}
	return def
}

func envDurationOrDefault(key string, def time.Duration) time.Duration {
	if v := os.Getenv(key); v != "" {
		d, err := time.ParseDuration(v)
		if err == nil {
			return d
		}
	}
	return def
}
