module Data.DecEqMap

import Decidable.Equality

import Data.DecEqSet

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
empty : DecEq k => DecEqMap k v
empty = Nil

export
add : DecEq k => (x : (k, v)) -> (xs : DecEqMap k v) -> {auto 0 prf : has (fst x) xs = False} -> DecEqMap k v
add = (::)

export
toList : DecEqMap k v -> List (k, v)
toList Nil = []
toList (x :: xs) = x :: toList xs

export
keys : DecEqMap k v -> DecEqSet k
keys Nil = empty
keys ((k, _) :: xs) = add k (keys xs) {prf = ?TODO57}

export
inside : (x : k) -> (xs : DecEqMap k v) -> Either (has x xs = False) (has x xs = True)
inside x [] = Left Refl
inside x ((::) (y, yv) ys {prf = hasY}) with (decEq x y)
  inside y ((::) (y, yv) ys) | (Yes Refl) = Right Refl
  inside x ((::) (y, yv) ys) | (No contra) = inside x ys

export
fromList : DecEq k => List (k, v) -> DecEqMap k v
fromList [] = Nil
fromList ((xk, xv) :: xs) = let rest : DecEqMap k v = fromList xs in
  case inside xk rest of
    Left _ => (xk, xv) :: rest
    Right _ => rest

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

mutual

  export
  set : (x : k) -> (xv : v) -> (s : DecEqMap k v) -> {auto 0 hasX : has x s = True} -> DecEqMap k v
  set x xv ((::) (y, yv) ys {prf = hasY}) with (decEq x y)
    set y xv ((::) (y, yv) ys) | (Yes Refl) = (::) (y, xv) ys
    set x xv ((::) (y, yv) ys) | (No contra) = (::) (y, yv) (set x xv ys) {prf = setLemma x xv y ys hasX hasY}

  0 setLemma : (x : k) -> (xv : v) -> (y : k) -> (ys : DecEqMap k v) -> (hasX : has x ys = True) -> (hasY : has y ys = False) -> has y (set x xv ys) = False
  setLemma x xv y ((z, zv) :: ys) hasX hasY with (decEq x z)
    setLemma z xv y ((z, zv) :: ys) hasX hasY | (Yes Refl) with (decEq y z)
      setLemma z xv y ((z, zv) :: ys) hasX hasY | (Yes Refl) | (No contra) = hasY
    setLemma x xv y ((z, zv) :: ys) hasX hasY | (No contra) with (decEq y z)
      setLemma x xv y ((z, zv) :: ys) hasX hasY | (No contra) | (No f) = setLemma x xv y ys hasX hasY

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

0 hasXSet : (x : k) -> (xv : v) -> (s : DecEqMap k v) -> (has x s = True) -> has x (set x xv s) = True
hasXSet x xv ((::) (y , yv) xs {prf = hasY}) hasX with (decEq x y)
  hasXSet y xv ((::) (y , yv) xs {prf = hasY}) hasX | (Yes Refl) with (decEq y y)
    hasXSet y xv ((::) (y , yv) xs {prf = hasY}) hasX | (Yes Refl) | (Yes Refl) = Refl
    hasXSet y xv ((::) (y , yv) xs {prf = hasY}) hasX | (Yes Refl) | (No contra) = absurd (contra Refl)
  hasXSet x xv ((::) (y , yv) xs {prf = hasY}) hasX | (No contra) with (decEq x y)
    hasXSet x xv ((::) (y , yv) xs {prf = hasY}) hasX | (No contra) | (Yes prf) = Refl
    hasXSet x xv ((::) (y , yv) xs {prf = hasY}) hasX | (No contra) | (No f) = hasXSet x xv xs hasX

0 proofSetGet : (x : k) -> (xv : v) -> (s : DecEqMap k v) -> (hasX : has x s = True) ->
  let u = hasXSet x xv s hasX in get x (set x xv s) = xv
proofSetGet x xv ((::) (y, yv) xs {prf = hasY}) hasX with (decEq x y)
  proofSetGet y xv ((::) (y, yv) xs {prf = hasY}) hasX | (Yes Refl) = rewrite decEqSame y in Refl
  proofSetGet x xv ((::) (y, yv) xs {prf = hasY}) hasX | (No contra) = ?TODO54


-- tests

-- ta : DecEqMap Nat String
-- ta = []

-- tb : DecEqMap Nat String
-- tb = [(1, "one")]

-- tc : DecEqMap Nat String
-- tc = [(1, "one"), (2, "two")]

-- td : DecEqMap Nat String
-- td = [(1, "one"), (2, "two"), (2, "two")] -- should error