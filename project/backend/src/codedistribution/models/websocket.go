package models

import (
	"fmt"
	"log"

	"github.com/gorilla/websocket"
)

type WebSocket struct {
	Conn     *websocket.Conn
	Out      chan []byte
	In       chan []byte
	Events   map[string]EventHandler
	ClientID string
}

// reading every incoming message from the websocket
// don't need to check for valid jwt refresh cookie in runtime, because the initial connection request was already valid
// it gets invalidated on the next connection request
func (ws *WebSocket) Reader() {
	// if anything goes wrong, close the connection
	defer func() {
		ws.Conn.Close()
		// set nil to websocket for the client
		ws.Conn = nil
	}()

	// infinite loop
	for {
		_, msg, err := ws.Conn.ReadMessage()

		// error while receiving messages -> termination of websocket channel
		if err != nil {

			// triggers on every error which was not provided as error code
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Println("new unique websocket error: " + err.Error())
			}

			// triggers on error which was provided as error code
			if websocket.IsCloseError(err, websocket.CloseAbnormalClosure, websocket.CloseGoingAway) {
				switch err.(*websocket.CloseError).Code {
				case websocket.CloseAbnormalClosure:
					// 1006 (abnormal closure) error code
				case websocket.CloseGoingAway:
					// 1001 (GoingAway) error code
				}
			}

			// call defer
			break
		}

		event, err := NewEventFromRaw(msg)
		if err != nil {
			// failed to create the event object (json formatting)
			log.Printf("%v\n", err)
		}

		// log.Printf("recv: %v\n", event)

		// executes the .On callbacks if message was in the right format
		if action, ok := ws.Events[event.Name]; ok {
			// go action(event)
			action(event)
		}
	}
}

// sending every outgoing message to the client from the websocket
func (ws *WebSocket) Writer() {

	for {
		select {
		case msg, ok := <-ws.Out:
			if !ok {
				ws.Conn.WriteMessage(websocket.CloseMessage, make([]byte, 0))
				return
			}
			w, err := ws.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(msg)
			w.Close()
		}
	}
}

func (ws *WebSocket) On(eventName string, action EventHandler) *WebSocket {
	ws.Events[eventName] = action
	return ws
}

// TODO code below currently not in use
type WebSocketList []WebSocket

func (wsl *WebSocketList) Add(ws *WebSocket) *WebSocketList {
	(*wsl) = append((*wsl), *ws)
	return wsl
}
func (wsl *WebSocketList) Remove(clientID string) (*WebSocketList, error) {
	var pos int = -1

	for i, ws := range *wsl {
		if ws.ClientID == clientID {
			pos = i
		}
	}

	if pos == -1 {
		return nil, fmt.Errorf("websocket not found")
	}

	temp := *wsl
	temp = append(temp[:pos], temp[pos+1:]...)
	*wsl = temp

	return wsl, nil
}

func (wsl WebSocketList) Get(clientID string) (*WebSocket, error) {
	for i, ws := range wsl {
		if ws.ClientID == clientID {
			return &wsl[i], nil
		}
	}
	return nil, fmt.Errorf("couldn't find websocket")
}
func (wsl WebSocketList) Exist(clientID string) bool {
	for _, ws := range wsl {
		if ws.ClientID == clientID {
			return true
		}
	}
	return false
}
