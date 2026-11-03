package chat

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"unicode/utf8"
)

const (
	MaxMessages     = 40
	MaxContentRunes = 6000
	MaxTotalRunes   = 24000
)

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type Request struct {
	Messages []Message `json:"messages"`
}

type Response struct {
	Role          string  `json:"role"`
	Content       string  `json:"content"`
	Timestamp     string  `json:"timestamp"`
	DesktopAction *string `json:"desktop_action,omitempty"`
	DesktopProof  *string `json:"desktop_proof,omitempty"`
}

var ErrInvalid = errors.New("invalid chat request")

func DecodeRequest(data []byte) (Request, error) {
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	var request Request
	if err := decoder.Decode(&request); err != nil {
		return Request{}, fmt.Errorf("%w: %v", ErrInvalid, err)
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		return Request{}, fmt.Errorf("%w: trailing data", ErrInvalid)
	}
	if err := Validate(request); err != nil {
		return Request{}, err
	}
	return request, nil
}

func Validate(request Request) error {
	if len(request.Messages) == 0 || len(request.Messages) > MaxMessages {
		return fmt.Errorf("%w: message count", ErrInvalid)
	}
	total := 0
	for _, message := range request.Messages {
		if message.Role != "user" && message.Role != "assistant" {
			return fmt.Errorf("%w: role", ErrInvalid)
		}
		if strings.TrimSpace(message.Content) == "" {
			return fmt.Errorf("%w: empty content", ErrInvalid)
		}
		runes := utf8.RuneCountInString(message.Content)
		if runes > MaxContentRunes {
			return fmt.Errorf("%w: content too long", ErrInvalid)
		}
		total += runes
	}
	if total > MaxTotalRunes {
		return fmt.Errorf("%w: conversation too long", ErrInvalid)
	}
	if request.Messages[len(request.Messages)-1].Role != "user" {
		return fmt.Errorf("%w: last message must be user", ErrInvalid)
	}
	return nil
}

type Event map[string]any
