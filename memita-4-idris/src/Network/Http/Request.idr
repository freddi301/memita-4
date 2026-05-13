module Network.Http.Request

import Data.String
import Data.List
import Data.List1
import Text.Lexer
import Text.Parser

%default total

public export
data HttpMethod = GET | POST | PUT | PATCH | DELETE

export
implementation Eq HttpMethod where
  GET == GET = True
  POST == POST = True
  PUT == PUT = True
  PATCH == PATCH = True
  DELETE == DELETE = True
  _ == _ = False

public export
record HttpRequest where
  constructor MakeHttpRequest
  method : HttpMethod

-- https://idris2.readthedocs.io/en/latest/cookbook/parsing.html

data HttpTokenKind =
  Method HttpMethod

implementation Eq HttpTokenKind where
  (Method m1) == (Method m2) = m1 == m2

implementation TokenKind HttpTokenKind where
  TokType (Method _) = HttpMethod
  -- TokType _ = ()
  tokValue (Method m) _ = m
  -- tokValue _ _ = ()

HttpToken = Token HttpTokenKind

tokenMap : TokenMap HttpToken
tokenMap = toTokenMap [
  (exact "GET", Method GET),
  (exact "POST", Method POST),
  (exact "PUT", Method PUT),
  (exact "PATCH", Method PATCH),
  (exact "DELETE", Method DELETE)
]

lexRequest : String -> Maybe (List (WithBounds HttpToken))
lexRequest string =
  case lex tokenMap string of
    (tokens, _, _, rest_of_string) => Just tokens
    _ => Nothing

req : Grammar state HttpToken True HttpRequest
req = do
  method <- match (Method GET) <|> match (Method POST) <|> match (Method PUT) <|> match (Method PATCH) <|> match (Method DELETE)
  pure $ MakeHttpRequest {method = method}

export
parseRequest : String -> Maybe HttpRequest
parseRequest string = do
  tokens <- lexRequest string
  case parse req tokens of
    Right (l, []) => Just l
    _ => Nothing

TEST_A = parseRequest "POST / HTTP/1.1\r\nHost: example.com\r\n\r\n" = Just (MakeHttpRequest POST)