//go:build windows

package harness

import "os/exec"

func configureProcessGroup(cmd *exec.Cmd) {}

func terminateProcess(cmd *exec.Cmd) {
	if cmd.Process != nil {
		_ = cmd.Process.Kill()
	}
}
