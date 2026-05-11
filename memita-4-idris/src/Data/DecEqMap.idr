module Data.DecEqMap

import Decidable.Equality

%default total

mutual

  export
  data DecEqMap : (k : Type) -> (v : Type) -> Type where
    Nil : DecEq k => DecEqMap k v
    (::) : DecEq k => (x : (k, v)) -> (xs : DecEqMap k v) -> {auto 0 prf : has (fst x) xs = False} -> DecEqMap k v

  export
  has : (x : k) -> (xs : DecEqMap k v) -> Bool
  has x Nil = False
  has x ((y, _) :: xs) = case decEq x y of
    Yes _ => True
    No _ => has x xs

export
toList : DecEqMap k v -> List (k, v)
toList Nil = []
toList (x :: xs) = x :: toList xs

export
decHas : (x : k) -> (xs : DecEqMap k v) -> Dec (has x xs = True)
decHas x Nil = No absurd
decHas x ((y, _) :: xs) with (decEq x y)
  decHas x ((x, _) :: xs) | Yes Refl = Yes Refl
  _ | No xNeqY = decHas x xs

export
decHasnt : (x : k) -> (xs : DecEqMap k v) -> Dec (has x xs = False)
decHasnt x Nil = Yes Refl
decHasnt x ((y, _) :: xs) with (decEq x y)
  _ | Yes _ = No absurd
  _ | No _ = decHasnt x xs

export
fromList : DecEq k => List (k, v) -> DecEqMap k v
fromList [] = Nil
fromList ((xk, xv) :: xs) with (decHasnt xk (fromList xs))
  _ | Yes _ = (xk, xv) :: fromList xs
  _ | No _ = fromList xs

mutual

  export
  rem : (x : k) -> (xs : DecEqMap k v) -> {auto 0 prf : has x xs = True} -> DecEqMap k v

export
get : (x : k) -> (s : DecEqMap k v) -> {auto 0 prf : has x s = True} -> v

proofAddHas : DecEq k => (x : k) -> (xv : v) -> (s : DecEqMap k v) -> (has x s = False) -> has x ((x, xv) :: s) = True

proofRemHasNot : DecEq k => (x : k) -> (s : DecEqMap k v) -> (has x s = True) -> has x (rem x s) = False

proofAddGet : DecEq k => (x : k) -> (xv : v) -> (s : DecEqMap k v) -> (has x s = False) -> get x ((x, xv) :: s) = xv


-- tests

-- ta : DecEqMap Nat String
-- ta = []

-- tb : DecEqMap Nat String
-- tb = [(1, "one")]

-- tc : DecEqMap Nat String
-- tc = [(1, "one"), (2, "two")]

-- td : DecEqMap Nat String
-- td = [(1, "one"), (2, "two"), (2, "two")] -- should error