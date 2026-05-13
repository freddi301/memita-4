module Experiments.HttpServer

import Network.Socket
import Network.Socket.Data
 
htmlBody : String
htmlBody = """
<!DOCTYPE html>
<html>
  <head><title>Idris 2 Server</title></head>
  <body>
    <h1>Hello from Idris 2!</h1>
    <p>This is a hardcoded response.</p>
  </body>
</html>
"""
 
-- A minimal valid HTTP/1.1 response
httpResponse : String
httpResponse =
  "HTTP/1.1 200 OK\r\n" ++
  "Content-Type: text/html; charset=utf-8\r\n" ++
  "Content-Length: " ++ show (length htmlBody) ++ "\r\n" ++
  "Connection: close\r\n" ++
  "\r\n" ++
  htmlBody
 
-- Handle one connection: recv the request, send the response, close
handleConn : Socket -> IO ()
handleConn conn = do
  Right (req, _) <- recv conn 4096
    | Left err => do
        putStrLn $ "recv error: " ++ show err
        close conn
  putStrLn $ "--- Request ---\n" ++ req
  Right _ <- send conn httpResponse
    | Left err => putStrLn $ "send error: " ++ show err
  close conn
 
-- Accept loop: blocks on accept, handles connection, repeats
acceptLoop : Socket -> IO ()
acceptLoop sock = do
  Right (conn, addr) <- accept sock
    | Left err => do
        putStrLn $ "accept error: " ++ show err
        acceptLoop sock
  putStrLn $ "Connection from: " ++ show addr
  handleConn conn
  acceptLoop sock
 
main : IO ()
main = do
  -- Create a TCP socket
  Right sock <- socket AF_INET Stream 0
    | Left err => putStrLn $ "socket() failed: " ++ show err
 
  -- Bind to all interfaces on port 9090
  -- Nothing = bind to 0.0.0.0
  0 <- bind sock Nothing 9090
    | err => do
         putStrLn $ "bind() failed with code: " ++ show err
         close sock
  0 <- listen sock
    | err => do
         putStrLn $ "listen() failed with code: " ++ show err
         close sock
  putStrLn "Listening on http://localhost:9090 ..."
  acceptLoop sock
 