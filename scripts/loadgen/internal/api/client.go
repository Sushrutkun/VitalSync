package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

type Client struct {
	baseURL string
	http    *http.Client
}

func NewClient(baseURL string, timeout time.Duration) *Client {
	transport := &http.Transport{
		MaxIdleConns:        500,
		MaxIdleConnsPerHost: 200,
		MaxConnsPerHost:     200,
		IdleConnTimeout:     90 * time.Second,
	}
	return &Client{
		baseURL: baseURL,
		http: &http.Client{
			Timeout:   timeout,
			Transport: transport,
		},
	}
}

// Signup creates a new account. Returns auth tokens on 201, ErrUserExists on 409.
func (c *Client) Signup(ctx context.Context, req SignupRequest) (*AuthResponse, error) {
	var out AuthResponse
	err := c.post(ctx, "/api/v1/auth/signup", "", req, &out, http.StatusCreated)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

// Login exchanges credentials for tokens. Returns 200 on success.
func (c *Client) Login(ctx context.Context, req LoginRequest) (*AuthResponse, error) {
	var out AuthResponse
	err := c.post(ctx, "/api/v1/auth/login", "", req, &out, http.StatusOK)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

// SyncHealth pushes one snapshot. Backend returns 202 Accepted on success.
func (c *Client) SyncHealth(ctx context.Context, accessToken string, req HealthSyncRequest) (*HealthSyncResponse, error) {
	var out HealthSyncResponse
	err := c.post(ctx, "/api/v1/health/sync", accessToken, req, &out, http.StatusAccepted)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

var ErrUserExists = errors.New("user already exists")
var ErrUnauthorized = errors.New("unauthorized")

type HTTPError struct {
	Status int
	Body   string
}

func (e *HTTPError) Error() string {
	return fmt.Sprintf("http %d: %s", e.Status, e.Body)
}

func (c *Client) post(ctx context.Context, path, bearerToken string, body, out any, expectedStatus int) error {
	buf, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(buf))
	if err != nil {
		return fmt.Errorf("new request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")
	if bearerToken != "" {
		httpReq.Header.Set("Authorization", "Bearer "+bearerToken)
	}

	resp, err := c.http.Do(httpReq)
	if err != nil {
		return fmt.Errorf("do: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))

	switch resp.StatusCode {
	case expectedStatus:
		if out != nil && len(respBody) > 0 {
			if err := json.Unmarshal(respBody, out); err != nil {
				return fmt.Errorf("unmarshal: %w (body=%s)", err, string(respBody))
			}
		}
		return nil
	case http.StatusConflict:
		return ErrUserExists
	case http.StatusUnauthorized, http.StatusForbidden:
		return ErrUnauthorized
	default:
		return &HTTPError{Status: resp.StatusCode, Body: string(respBody)}
	}
}
