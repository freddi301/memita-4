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
  -- alternative notation for proofs
  -- has x ((y, _) :: xs) with (decEq x y)
  --   _ | Yes _ = True
  --   _ | No _ = has x xs

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
  rem : (x : k) -> (s : DecEqMap k v) -> {auto 0 hasX : has x s = True} -> DecEqMap k v
  rem x ((::) (y, yv) ys {prf = hasY}) with (decEq x y)
    _ | Yes _ = ys
    _ | No _ = (::) (y, yv) (rem x ys) {prf = remLemma x y ys hasX hasY}

  0 remLemma : (x : k) -> (y : k) -> (xs : DecEqMap k v) -> (hasX : has x xs = True) -> (hasY : has y xs = False) -> has y (rem x xs) = False
  remLemma x y ((z, zv) :: ys) hasX hasY with (decEq x z)
    remLemma z y ((z, zv) :: ys) hasX hasY | (Yes Refl) with (decEq y z)
      remLemma z y ((z, zv) :: ys) hasX hasY | (Yes Refl) | (No contra) = hasY
    remLemma x y ((z, zv) :: ys) hasX hasY | (No contra) with (decEq y z)
      remLemma x y ((z, zv) :: ys) hasX hasY | (No contra) | (No f) = remLemma x y ys hasX hasY

export
get : (x : k) -> (s : DecEqMap k v) -> {auto 0 hasX : has x s = True} -> v
get x ((y, yv) :: ys) with (decEq x y)
  _ | Yes _ = yv
  _ | No _ = get x ys

0 proofAddHas : DecEq k => (x : k) -> (xv : v) -> (s : DecEqMap k v) -> (has x s = False) -> has x ((x, xv) :: s) = True
proofAddHas x xv s hasX with (decEq x x)
  proofAddHas x xv s hasX | (Yes Refl) = Refl
  proofAddHas x xv s hasX | (No contra) = absurd (contra Refl)

0 proofRemHas : (x : k) -> (s : DecEqMap k v) -> (has x s = True) -> has x (rem x s) = False
proofRemHas x ((::) (y, yv) ys {prf = hasY}) hasX with (decEq x y)
  proofRemHas y ((::) (y, yv) ys {prf = hasY}) hasX | (Yes Refl) = hasY
  proofRemHas x ((::) (y, yv) ys {prf = hasY}) hasX | (No contra) with (decEq x y)
    proofRemHas y ((::) (y, yv) ys {prf = hasY}) hasX | (No contra) | (Yes Refl) = absurd (contra Refl)
    proofRemHas x ((::) (y, yv) ys {prf = hasY}) hasX | (No contra) | (No f) = proofRemHas x ys hasX

0 addWithProof : DecEq k => (x : k) -> (xv : v) -> (s : DecEqMap k v) -> (has x s = False) -> (xs : DecEqMap k v ** has x xs = True)
addWithProof x xv s hasX = ((x, xv) :: s ** proofAddHas x xv s hasX)

0 proofAddGet : DecEq k => (x : k) -> (xv : v) -> (s : DecEqMap k v) -> (hasntX : has x s = False) -> let (xs ** hasX) = addWithProof x xv s hasntX in get x xs = xv
proofAddGet x xv s hasntX with (decEq x x)
  proofAddGet x xv s hasntX | (Yes Refl) = Refl
  proofAddGet x xv s hasntX | (No contra) = absurd (contra Refl)


-- tests

-- ta : DecEqMap Nat String
-- ta = []

-- tb : DecEqMap Nat String
-- tb = [(1, "one")]

-- tc : DecEqMap Nat String
-- tc = [(1, "one"), (2, "two")]

-- td : DecEqMap Nat String
-- td = [(1, "one"), (2, "two"), (2, "two")] -- should error