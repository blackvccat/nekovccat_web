package relationship

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"regexp"
	"time"
)

var sessionPattern = regexp.MustCompile(`^[a-f0-9]{48}$`)

func CreateUnlockProof(sessionNonce, secret string, now time.Time) string {
	if !sessionPattern.MatchString(sessionNonce) || len(secret) < 32 {
		return ""
	}
	expires := now.Unix() + 120
	payload := fmt.Sprintf("v1.%s.%d", sessionNonce, expires)
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte("relationship-unlock:" + payload))
	return payload + "." + hex.EncodeToString(mac.Sum(nil))
}
