package relationship

import (
	"strings"
	"testing"
	"time"
)

func TestCreateUnlockProofBoundToSessionAndExpiry(t *testing.T) {
	secret := strings.Repeat("s", 32)
	session := strings.Repeat("a", 48)
	now := time.Unix(1_700_000_000, 0)
	proof := CreateUnlockProof(session, secret, now)
	if !strings.HasPrefix(proof, "v1."+session+".1700000120.") {
		t.Fatalf("unexpected proof: %s", proof)
	}
	if CreateUnlockProof("bad", secret, now) != "" {
		t.Fatal("invalid session must fail")
	}
	if CreateUnlockProof(session, "short", now) != "" {
		t.Fatal("short secret must fail")
	}
}
