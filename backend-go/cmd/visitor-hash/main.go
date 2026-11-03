package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"nekoweb/backend-go/internal/visitor"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	if !scanner.Scan() {
		fmt.Fprintln(os.Stderr, "read a password from stdin")
		os.Exit(1)
	}
	password := strings.TrimRight(scanner.Text(), "\r\n")
	if password == "" {
		fmt.Fprintln(os.Stderr, "password must not be empty")
		os.Exit(1)
	}
	hash, err := visitor.HashPassword(password, visitor.PBKDF2Iterations, nil)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Println(hash)
}
