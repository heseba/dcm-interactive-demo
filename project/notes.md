# Notes

## Go

**articles:**
[install Go locally](https://www.digitalocean.com/community/tutorial_series/how-to-install-and-set-up-a-local-programming-environment-for-go)
build for different operating systems and architectures

- [https://www.digitalocean.com/community/tutorials/building-go-applications-for-different-operating-systems-and-architectures](https://www.digitalocean.com/community/tutorials/building-go-applications-for-different-operating-systems-and-architectures)
- [https://www.digitalocean.com/community/tutorials/how-to-build-go-executables-for-multiple-platforms-on-ubuntu-16-04](https://www.digitalocean.com/community/tutorials/how-to-build-go-executables-for-multiple-platforms-on-ubuntu-16-04)

`go env GOPATH` = `/go` = go workspace (bin, pkg, src)
`/go/src` = path of your packages
`go env GOBIN` = `/go/bin` = path of global go programs
`go env GOROOT` = `/usr/local/go` = path of your go installation

**help from shell:**
`go help <command>`

**build main package of all packges in $GOPATH/src**
`go build ./...`

**build specific main package in current directory:**
`go build github.com/user/projectname`
**build specific main package with custom name:**
`go build -o server github.com/user/projectname`

**list all possible operating system and architectures:**
`go tool dist list`

**clear mod cache**
`go clean -cache -modcache -i -r`

**update packages**
`go get -u all`

### Go Build vs. Go Install

**build**
`go build <package/user/app>` will read from `/go/src` and builds the application with its dependencies in the current working directory. Ouput directory can be changed with `-o` flag.

**install**
`go install <package/user/app>` will read from `/go/src` and builds the application in a temporary directory then moves it to `/go/bin`. This will make your app accessible across your system in shell.

## Environment

**vscode workspace & devcontainer:**

- gets mounted into go container: /workspace
- contains all local development code
- extension: Go requires gotools which will be stored in /vscode/gotools

**VSCode Go Extension: recognize packages**
You get several warnings, when you current vscode directory is not inside the module. You have to open vscode inside your application folder `code /go/src/<app> -r` so that the extension recognizes all paths.

## Docker

**remove all containers and networks:**
`docker-compose down`

### Development

**check dev configuration**
`docker-compose config`

## VSCode Devcontainer

[https://code.visualstudio.com/docs/remote/devcontainerjson-reference]

## Web worker

https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker#parameters

## WebSockets

CloseEvent statuscodes: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent

- readystate codes: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
- bufferedAmount: represents the number of bytes of UTF-8 text that have been queued using the send() method.
- protocol: Lets the server know which protocol the client understands and can use over WebSocket

## Dependency Graph

`apt update && apt install graphviz`

`go get github.com/kisielk/godepgraph && go install github.com/kisielk/godepgraph`

`godepgraph -s . | dot -Tpng -o godepgraph.png`
