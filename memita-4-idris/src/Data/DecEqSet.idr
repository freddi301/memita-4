module Data.DecEqSet

import Decidable.Equality

%default total

mutual

  export
  data DecEqSet : (a : Type) -> Type where
    Nil : DecEq a => DecEqSet a
    (::) : DecEq a => (x : a) -> (xs : DecEqSet a) -> {auto 0 prf : has x xs = False} -> DecEqSet a

  export
  has : (x : a) -> (xs : DecEqSet a) -> Bool
  has x Nil = False
  has x (y :: xs) = case decEq x y of
    Yes _ => True
    No _ => has x xs

export
toList : DecEqSet a -> List a
toList Nil = []
toList (x :: xs) = x :: toList xs

export
decHas : (x : a) -> (xs : DecEqSet a) -> Dec (has x xs = True)
decHas x Nil = No absurd
decHas x (y :: xs) with (decEq x y)
  decHas x (x :: xs) | Yes Refl = Yes Refl
  _ | No xNeqY = decHas x xs

export
decHasnt : (x : a) -> (xs : DecEqSet a) -> Dec (has x xs = False)
decHasnt x Nil = Yes Refl
decHasnt x (y :: xs) with (decEq x y)
  _ | Yes _ = No absurd
  _ | No _ = decHasnt x xs

export
fromList : DecEq a => List a -> DecEqSet a
fromList [] = Nil
fromList (x :: xs) with (decHasnt x (fromList xs))
  _ | Yes _ = x :: fromList xs
  _ | No _ = fromList xs

mutual

  export
  rem : (x : a) -> (xs : DecEqSet a) -> {auto 0 prf : has x xs = True} -> DecEqSet a
  rem x ((::) y xs {prf = hasY}) with (decEq x y)
    _ | Yes _ = xs
    _ | No xNeqY = (::) y (rem x xs) {prf = remLemma x y xNeqY xs prf hasY}

  remLemma : (x:a) -> (y:a) -> (Not (x = y)) -> (xs : DecEqSet a) -> (hasX : has x xs = True) -> (hasY : has y xs = False) -> has y (rem x xs) = False
  remLemma x y xNeqY (z :: ys) hasX hasY with (decEq x z)
    remLemma z y xNeqY (z :: ys) hasX hasY | (Yes Refl) with (decEq y z)
      remLemma z y xNeqY (z :: ys) hasX hasY | (Yes Refl) | (No _) = hasY
    remLemma x y xNeqY (z :: ys) hasX hasY | (No _) with (decEq y z)
      remLemma x y xNeqY (z :: ys) hasX hasY | (No _) | (No _) = remLemma x y xNeqY ys hasX hasY

proofAddHas : DecEq a => (x : a) -> (s : DecEqSet a) -> (has x s = False) -> has x (x :: s) = True
proofAddHas x s hasX with (decEq x x)
  proofAddHas x s hasX | (Yes Refl) = Refl
  proofAddHas x s hasX | (No contra) = absurd (contra Refl)

proofRemHas : (x : a) -> (s : DecEqSet a) -> (has x s = True) -> has x (rem x s) = False



-- tests

-- ta : DecEqSet Nat
-- ta = []

-- tb : DecEqSet Nat
-- tb = [1]

-- tc : DecEqSet Nat
-- tc = [1, 2]

-- td : DecEqSet Nat
-- td = [1, 2, 2] -- shoDecEqSetd error