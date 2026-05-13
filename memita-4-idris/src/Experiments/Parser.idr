module Experiments.Parser

-- import Data.List

%default total

export
data Parser : Type -> Type -> Type where
  Err : Parser x y
  End : y -> Parser x y
  Con : (x -> Parser x y) -> Parser x y
  Alt : Parser x y -> Parser x y -> Parser x y

export
(>>=) : Parser x y -> (y -> Parser x z) -> Parser x z
Err >>= f = Err
End y >>= f = f y
Con k >>= f = Con $ \x => k x >>= f
Alt l r >>= f = Alt (l >>= f) (r >>= f)

export
(>>) : Parser x y -> Parser x z -> Parser x z
p >> q = p >>= const q

export
(<&>) : Parser x y -> (y -> z) -> Parser x z
p <&> f = p >>= (End . f)

export
(<|>) : Parser x y -> Parser x y -> Parser x y
l <|> r = Alt l r

export
parse : Parser x y -> List x -> List y
parse (End y) [] = [y]
parse (Con f) (x :: xs) = parse (f x) xs
parse (Alt l r) xs = parse l xs ++ parse r xs
parse _ _ = []

--

export
One : Parser x x
One = Con End

export
throw : Parser x y
throw = Err

export
pure : y -> Parser x y
pure y = End y

export
exact : String -> Parser Char String
exact s = rec (unpack s) [] where
  rec : List Char -> List Char -> Parser Char String
  rec [] acc = End (pack acc)
  rec (c :: cs) acc = do
    x <- One
    if x == c then rec cs (acc ++ [x]) else Err

export
many : {default 1000 max : Nat} -> Parser x y -> Parser x (List y)
many {max = Z} p = End []
many {max = S k} p = (do
  x <- p
  xs <- many {max = k} p
  pure (x :: xs)) <|> End []

export
alpha : Parser Char Char
alpha = do
  x <- One
  if isAlpha x then End x else Err

export
notChar : Char -> Parser Char Char
notChar c = do
  x <- One
  if x /= c then End x else Err

export
is: (p : x -> Bool) -> Parser x x
is p = do
  x <- One
  if p x then End x else Err

--

TEST_A : parse (End 4) [] = [4]
TEST_A = Refl

TEST_B : parse (End 4) [True] = []
TEST_B = Refl

TEST_C : parse (One) [] = []
TEST_C = Refl

TEST_D : parse (One) [True] = [True]
TEST_D = Refl

TEST_E : parse (do x <- One; End x) [True] = [True]
TEST_E = Refl

TEST_F : parse (do x <- One; End x) [] = []
TEST_F = Refl

TEST_G : parse (do x <- One; y <- One; End (x, y)) [True, False] = [(True, False)]
TEST_G = Refl

TEST_H : parse (do x <- One; y <- One; End (x, y)) [True] = []
TEST_H = Refl

TEST_I : parse (do x <- One; y <- One; End (x, y)) [] = []
TEST_I = Refl

TEST_J : parse (exact "hello") (unpack "hello") = ["hello"]
TEST_J = Refl

TEST_K : parse (exact "hello") (unpack "hell") = []
TEST_K = Refl

TEST_L : parse (exact "hello" >> exact " " >> exact "world") (unpack "hello world") = ["world"]
TEST_L = Refl

TEST_M : parse (exact "GET" <|> exact "POST") (unpack "GET") = ["GET"]
TEST_M = Refl

TEST_N : parse (exact "GET" <|> exact "POST") (unpack "POST") = ["POST"]
TEST_N = Refl

TEST_O : parse (exact "GET" <|> exact "POST") (unpack "PUT") = []
TEST_O = Refl

TEST_P : parse (many One) [True, False] = [[True, False]]
TEST_P = Refl

TEST_Q : parse (many One) (unpack "Ciaooo") = [unpack "Ciaooo"]
TEST_Q = Refl
