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
  -- alternative notation for proofs
  -- has x (y :: xs) with (decEq x y)
  --   _ | Yes _ = True
  --   _ | No _ = has x xs

export
empty : DecEq a => DecEqSet a
empty = Nil

export
add : DecEq a => (x : a) -> (xs : DecEqSet a) -> {auto 0 prf : has x xs = False} -> DecEqSet a
add = (::)

export
toList : DecEqSet a -> List a
toList Nil = []
toList (x :: xs) = x :: toList xs

export
inside : (x : a) -> (xs : DecEqSet a) -> Either (has x xs = False) (has x xs = True)
inside x [] = Left Refl
inside x ((::) y ys {prf = hasY}) with (decEq x y)
  inside y ((::) y ys) | (Yes Refl) = Right Refl
  inside x ((::) y ys) | (No contra) = inside x ys

export
fromList : DecEq a => List a -> DecEqSet a
fromList [] = Nil
fromList (x :: xs) = let rest = fromList xs in
  case inside x rest of
    Left _ => x :: rest
    Right _ => rest

export
decEqSame : DecEq a => (x : a) -> decEq x x = Yes Refl
decEqSame x with (decEq x x)
  _ | (Yes Refl) = Refl
  _ | (No contra) = absurd (contra Refl)

mutual

  export
  rem : (x : a) -> (xs : DecEqSet a) -> {auto 0 prf : has x xs = True} -> DecEqSet a
  rem x ((::) y ys {prf = hasY}) with (decEq x y)
    _ | Yes _ = ys
    _ | No _ = (::) y (rem x ys) {prf = remLemma x y ys prf hasY}

  0 remLemma : (x : a) -> (y : a) -> (xs : DecEqSet a) -> (hasX : has x xs = True) -> (hasY : has y xs = False) -> has y (rem x xs) = False
  remLemma x y (z :: ys) hasX hasY with (decEq x z)
    remLemma z y (z :: ys) hasX hasY | (Yes Refl) with (decEq y z)
      remLemma z y (z :: ys) hasX hasY | (Yes Refl) | (No _) = hasY
    remLemma x y (z :: ys) hasX hasY | (No _) with (decEq y z)
      remLemma x y (z :: ys) hasX hasY | (No _) | (No _) = remLemma x y ys hasX hasY

0 proofAddHas : DecEq a => (x : a) -> (s : DecEqSet a) -> (has x s = False) -> has x (add x s) = True
proofAddHas x s hasX with (decEq x x)
  proofAddHas x s hasX | (Yes Refl) = Refl
  proofAddHas x s hasX | (No contra) = absurd (contra Refl)

0 proofRemHas : (x : a) -> (s : DecEqSet a) -> (hasX : has x s = True) -> has x (rem x s) = False
proofRemHas x ((::) y ys {prf = hasY}) hasX with (decEq x y)
  proofRemHas y ((::) y ys {prf = hasY}) hasX | (Yes Refl) = hasY
  proofRemHas x ((::) y ys {prf = hasY}) hasX | (No contra) with (decEq x y)
    proofRemHas y ((::) y ys {prf = hasY}) hasX | (No contra) | (Yes Refl) = absurd (contra Refl)
    proofRemHas x ((::) y ys {prf = hasY}) hasX | (No contra) | (No f) = proofRemHas x ys hasX

-- tests

-- ta : DecEqSet Nat
-- ta = []

-- tb : DecEqSet Nat
-- tb = [1]

-- tc : DecEqSet Nat
-- tc = [1, 2]

-- td : DecEqSet Nat
-- td = [1, 2, 2] -- shoDecEqSetd error