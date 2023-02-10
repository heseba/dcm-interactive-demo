# Project

## Docker-Compose

**build WASM files:**

`docker-compose run --rm build-wasm`

**start Go web server:**

`docker-compose up go-server`

**for development start project in container:**

<!-- pass service port so that the container exposes the passed ports automatically  -->

`docker-compose run --rm --service-ports go-dev`

## Notes

Images are all copyright free taken from https://unsplash.com/

## API

The API is completely JSON driven. Every request will respond in JSON format either with status, error messages or queried data.
The API requires an API key, to access the data. The user specifies the keys as a configuration when initializing the Code Distributor.

Current keys are specified in the [`main.go`](backend/src/webserver/main.go) file of the webserver.  
Tests can be made by accessing `localhost:5005/api/v1/` as base URL when the server is running. The port can also be configured in the .env file.  
In Postman the key can be placed in the authorization tab. The key should be "Authorization" and the value is one of the keys. [[ref](https://learning.postman.com/docs/sending-requests/authorization/#api-key)]

### JSON Response

Used for errors or status messages.

```js
{
  status: 'alive, omit when empty',
  error: {
    code: 400,
    message: 'reason'
  }
}
```

### Status

**GET /** - see if API is alive or offline

### Clients

**GET /clients** - returns an array of active clients, empty array if none  
**PUT /clients + Body Form Data** - updates all clients in storage with the clients provided in the request body (updating fragments only) - requires an array of clients as content-type: `application/json`

```js
[
  {
    pos: 1,
    uuid: "3GfZvDbREzEbBCGN8xhTLDj7NAwqKBTjndHHJpAQottP0XM84d",
    fragments: [
      {
        id: "1",
        name: "GetHash",
        runOn: "client",
      },

      {
        id: "7",
        name: "SortFloats",
        runOn: "client",
      },
    ],
  },
  {
    pos: 2,
    uuid: "EhLEjYzffJHai5NUPMaWqAXo1hnpKrhYlNwrudgzkNGvC7M5Dw",
    fragments: [
      {
        id: "0",
        name: "Add",
        runOn: "client",
      },

      {
        id: "2",
        name: "CalcMwst",
        runOn: "client",
      },
    ],
  },
];
```

### Client

**GET /clients/{pos}** - returns a client depending on the insert order in the list of all clients  
**GET /clients?uuid={id}** - returns a specific client with a given client ID  
**PUT /clients?uuid={id} + Body Form Data** - updates all for a client in the request body provided fragments - requires an array of fragments as content-type: `application/json`

```js
{
  pos: 1,
  uuid: "V3IZCYKYaqQiTnVMJE0SnHqSah6rTJNdLCJ0kUym5KHpB8iY9T",
  fragments: [
    {
      id: "0",
      name: "Add",
      runOn: "client"
    },
    {
      id: "1",
      name: "GetHash",
      runOn: "client"
    },
  ]
}
```

### Fragments

**GET /clients/{pos}/fragments** - returns the fragment list of a client depending on the insert order in the list of all clients  
**PUT /clients/{pos}/fragments + Body Form Data** - updates all in the request body provided fragments - requires an array of fragments as content-type: `application/json`

```js
[
  {
    id: "1",
    name: "GetHash",
    runOn: "client",
  },
  {
    id: "7",
    name: "SortFloats",
    runOn: "client",
  },
];
```

### Fragment

**GET /clients/{pos}/fragments/{pos}** - returns a fragment of a client, both depending on the insert order in the list  
**PUT /clients/{pos}/fragments/{pos}?runon=(server|client)** - updates a specific fragment by the provided query parameter in the URL (mainly for the "runon" query)  
**GET /clients/{pos}/fragments?id={id}** - returns a specific fragment with a given fragment ID  
**PUT /clients/{pos}/fragments?id={id} + Body Form Data** - updates a specific fragment with a given fragment ID by the provided [key,value] pair in the request body (mainly for the "runon" key) as content-type: `application/x-www-form-urlencoded`

```js
{
  id: "0",
  name: "Add",
  runOn: "client"
}
```

## WebSockets

In order to connect to the server, a JWT for authentication is required from:

```text
http://${domain}:${port}/api/v1/auth
```

The first request without any cookie will respond with a new httponly (refresh JWT) cookie where every state of every function is reset.
Any subsequent request should contain the cookie (automatically) to identify existing states for that client by the encoded UUID inside the JWT.
Trying to send a modified cookie will result in an invalid action due to JWT signature and is answered with a delete cookie (invalidate) action for that client. (httponly cookies cannot be accessed by JavaScript)

With any valid authentication the server responds with a JWT access token which is needed to connect to the WebSocket route.
Before establishing a WebSocket connection the server checks against that token and if it's a verified one it will open up the connection.

WebSocket Connect route:

```
ws://${domain}:${port}/ws?cdat=xxx
```

cdat = `code_distribution_access_token`
