module Experiments.Parser

-- import Data.List

%default total

export
data Parser : Type -> Type -> Type where
  Err : Parser x y
  End : y -> Parser x y
  One : (x -> Parser x y) -> Parser x y
  Alt : Parser x y -> Parser x y -> Parser x y

export
(>>=) : Parser x y -> (y -> Parser x z) -> Parser x z
Err >>= f = Err
End y >>= f = f y
One k >>= f = One $ \x => k x >>= f
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
parse (One f) (x :: xs) = parse (f x) xs
parse (Alt l r) xs = parse l xs ++ parse r xs
parse _ _ = []

--

export
throw : Parser x y
throw = Err

export
pure : y -> Parser x y
pure y = End y

export
any : Parser x x
any = One End

-- TODO fix the max thing, with high number allcoates too much memory
export
many : {default 1000 max : Nat} -> Parser x y -> Parser x (List y)
many {max = Z} p = pure []
many {max = S k} p = (do
  x <- p
  xs <- many {max = k} p
  pure (x :: xs)) <|> pure []

export
optional : Parser x y -> Parser x (Maybe y)
optional p = (p <&> Just) <|> pure Nothing

-- TODO fix the max thing, with high number allcoates too much memory
export
separatedBy : {default 1000 max : Nat} -> Parser x y -> Parser x z -> Parser x (List y)
separatedBy {max = Z} p sep = pure []
separatedBy {max = S k} p sep = (do
  x <- p
  xs <- many {max = k} (sep >> p)
  pure (x :: xs)) <|> pure []

export
is: (p : x -> Bool) -> Parser x x
is p = do
  x <- any
  if p x then pure x else throw

export
(||) : (x -> Bool) -> (x -> Bool) -> x -> Bool
(p || q) x = p x || q x

export
not : (x -> Bool) -> x -> Bool
not p x = not (p x)

---

export
exact : String -> Parser Char ()
exact s = rec (unpack s) where
  rec : List Char -> Parser Char ()
  rec [] = pure ()
  rec (c :: cs) = do
    x <- any
    if x == c then rec cs else throw

export
lineEnd : Parser Char ()
lineEnd = (exact "\r\n") <|> (exact "\n")

--

Con : Parser x x
Con = any

TEST_A : parse (pure 4) [] = [4]
TEST_A = Refl

TEST_B : parse (pure 4) [True] = []
TEST_B = Refl

TEST_C : parse (Con) [] = []
TEST_C = Refl

TEST_D : parse (Con) [True] = [True]
TEST_D = Refl

TEST_E : parse (do x <- Con; pure x) [True] = [True]
TEST_E = Refl

TEST_F : parse (do x <- Con; pure x) [] = []
TEST_F = Refl

TEST_G : parse (do x <- Con; y <- Con; pure (x, y)) [True, False] = [(True, False)]
TEST_G = Refl

TEST_H : parse (do x <- Con; y <- Con; pure (x, y)) [True] = []
TEST_H = Refl

TEST_I : parse (do x <- Con; y <- Con; pure (x, y)) [] = []
TEST_I = Refl

TEST_J : parse (exact "hello") (unpack "hello") = [()]
TEST_J = Refl

TEST_K : parse (exact "hello") (unpack "hell") = []
TEST_K = Refl

TEST_L : parse (exact "hello" >> exact " " >> exact "world") (unpack "hello world") = [()]
TEST_L = Refl

TEST_M : parse (exact "GET" <|> exact "POST") (unpack "GET") = [()]
TEST_M = Refl

TEST_N : parse (exact "GET" <|> exact "POST") (unpack "POST") = [()]
TEST_N = Refl

TEST_O : parse (exact "GET" <|> exact "POST") (unpack "PUT") = []
TEST_O = Refl

TEST_P : parse (many Con) [True, False] = [[True, False]]
TEST_P = Refl

TEST_Q : parse (many Con) (unpack "Ciaooo") = [unpack "Ciaooo"]
TEST_Q = Refl

TEST_R : parse (separatedBy (is Prelude.isAlpha) (exact ",")) (unpack "a,b,c") = [['a', 'b', 'c']]
TEST_R = Refl