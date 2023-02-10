package websocket

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"codedistribution/clientregistry"
	"codedistribution/jwt"
	"codedistribution/models"
	"codedistribution/util"

	"github.com/gorilla/websocket"
)

func New(websocketConfig WebSocketConfig) {
	wshandler := http.HandlerFunc(websocketHandler)
	// check first if it's correct WebSocket request, then check which client
	middlewareChain := util.CreateMiddlewareChain(
		WebsocketMiddleware,
		IsAuthorizedMiddleware).Then(wshandler)
	websocketConfig.Router.Handle(websocketConfig.Path, middlewareChain)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:   2048,
	WriteBufferSize:  2048,
	HandshakeTimeout: 5 * time.Second,
	// allow any type of origin request prototype purposes
	CheckOrigin: func(req *http.Request) bool {
		return true
	},
}

// create new websocket
func NewWebSocket(res http.ResponseWriter, req *http.Request) (*models.WebSocket, error) {

	var ws *models.WebSocket

	// instead of nil it's possible to add a header
	conn, err := upgrader.Upgrade(res, req, nil)
	if err != nil {
		// not a websocket request
		log.Print("Error while upgrading websocket connection: ", err)
		return nil, err
	}

	jwtTokenString := req.URL.Query().Get("cdat")
	// authCookie, err := req.Cookie("cdrt")
	if jwtTokenString == "" {
		return nil, fmt.Errorf("no access token")
	}
	claims, err := jwt.GetJWTAccessTokenClaims(jwtTokenString)
	if err != nil {
		return nil, err
	}

	ws = &models.WebSocket{
		Conn:     conn,
		Out:      make(chan []byte),
		In:       make(chan []byte),
		Events:   make(map[string]models.EventHandler),
		ClientID: claims.Subject,
	}

	// override the current active websocket connection of the user
	client, _ := clientregistry.GetClients().GetClientByUUID(claims.Subject)
	client.WS = ws

	go ws.Reader()
	go ws.Writer()

	return ws, nil
}

func websocketHandler(res http.ResponseWriter, req *http.Request) {
	ws, err := NewWebSocket(res, req)
	if err != nil {
		log.Printf("Error creating websocket connection: %v", err)
		return
	}

	// handle incoming events from the client //
	ws.On("message", message(ws))

	// this should be triggered when the decision system pushed new updates so that the client gets informed about the new state
	ws.On("updateFragmentList", updateFragmentList(ws))

	ws.On("callFunction", callFunction(ws))
}
