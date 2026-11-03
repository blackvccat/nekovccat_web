package admission

type Rejection struct {
	Message    string
	RetryAfter int
	Code       string
}
