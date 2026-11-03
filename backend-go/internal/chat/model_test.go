package chat

import (
	"strings"
	"testing"
)

func TestDecodeRequestValid(t *testing.T) {
	request, err := DecodeRequest([]byte(`{"messages":[{"role":"user","content":"hello"}]}`))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(request.Messages) != 1 || request.Messages[0].Content != "hello" {
		t.Fatalf("unexpected request: %+v", request)
	}
}

func TestDecodeRequestRejectsUnknownFields(t *testing.T) {
	_, err := DecodeRequest([]byte(`{"messages":[{"role":"user","content":"hello","extra":true}]}`))
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestValidateRejectsInvalidMessages(t *testing.T) {
	cases := []Request{
		{},
		{Messages: []Message{{Role: "user", Content: "   "}}},
		{Messages: []Message{{Role: "assistant", Content: "hello"}}},
		{Messages: []Message{{Role: "user", Content: strings.Repeat("a", 6001)}}},
		{Messages: []Message{{Role: "user", Content: strings.Repeat("a", 24001)}}},
	}
	for _, request := range cases {
		if err := Validate(request); err == nil {
			t.Fatalf("expected invalid: %+v", request)
		}
	}
}

func TestValidateCountsRunesNotBytes(t *testing.T) {
	request := Request{Messages: []Message{{Role: "user", Content: strings.Repeat("猫", 6000)}}}
	if err := Validate(request); err != nil {
		t.Fatalf("6000 runes must be valid: %v", err)
	}
}
