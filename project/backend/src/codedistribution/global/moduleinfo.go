package global

import (
	"bufio"
	"log"
	"os"
	"path"
	"path/filepath"
	"runtime"
	"strings"
)

type CallerInfo struct {
	ModuleName  string
	PackageName string
	fileName    string
	funcName    string
	line        int
}

type ModuleInfo struct {
	ModulePath string
	CallInfo   CallerInfo
}

var moduleinfo ModuleInfo

func GetModuleInfo() *ModuleInfo {
	return &moduleinfo
}

func SetModuleInfo(mi ModuleInfo) {
	moduleinfo = mi
}

func CreateModuleInfo() ModuleInfo {
	pc, file, line, _ := runtime.Caller(2)
	absoluteFilePath, fileName := path.Split(file)
	parts := strings.Split(runtime.FuncForPC(pc).Name(), ".")
	pl := len(parts)
	packageName := ""
	funcName := parts[pl-1]

	if parts[pl-2][0] == '(' {
		funcName = parts[pl-2] + "." + funcName
		packageName = strings.Join(parts[0:pl-2], ".")
	} else {
		packageName = strings.Join(parts[0:pl-1], ".")
	}

	callInfo := &CallerInfo{
		ModuleName:  getPackageName(absoluteFilePath),
		PackageName: packageName,
		fileName:    fileName,
		funcName:    funcName,
		line:        line,
	}

	moduleinfo := ModuleInfo{
		ModulePath: absoluteFilePath,
		CallInfo:   *callInfo,
	}

	return moduleinfo
}

// read first line of go.mod file
func getPackageName(currentDir string) string {
	file, err := os.Open(filepath.Join(currentDir, "go.mod"))
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	scanner.Scan() // scan only first line (usually iterator)

	return strings.Split(scanner.Text(), " ")[1]
}

// func getFrame(skipFrames int) runtime.Frame {
// 	// We need the frame at index skipFrames+2, since we never want runtime.Callers and getFrame
// 	targetFrameIndex := skipFrames + 2

// 	// Set size to targetFrameIndex+2 to ensure we have room for one more caller than we need
// 	programCounters := make([]uintptr, targetFrameIndex+2)
// 	n := runtime.Callers(0, programCounters)

// 	frame := runtime.Frame{Function: "unknown"}
// 	if n > 0 {
// 		frames := runtime.CallersFrames(programCounters[:n])
// 		for more, frameIndex := true, 0; more && frameIndex <= targetFrameIndex; frameIndex++ {
// 			var frameCandidate runtime.Frame
// 			frameCandidate, more = frames.Next()
// 			if frameIndex == targetFrameIndex {
// 				frame = frameCandidate
// 			}
// 		}
// 	}
// 	return frame
// }
// // MyCaller returns the caller of the function that called it :)
// func MyCaller() string {
// 	// Skip GetCallerFunctionName and the function to get the caller of
// 	return getFrame(2).Function
// }
