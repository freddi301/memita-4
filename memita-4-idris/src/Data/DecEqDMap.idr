module Data.DecEqDMap

import Decidable.Equality

mutual

  export
  data DecEqDMap : (0 k : Type) -> (0 fv : k -> Type) -> Type where
    Nil :
      DecEq k =>
      DecEqDMap k fv
    (::) :
      DecEq k =>
      (h : (k ** fv k)) -> (t : DecEqDMap k fv) ->
      {auto 0 hasX : has (fst h) t = False} ->
      DecEqDMap k fv

  export
  has : (xk : k) -> (m : DecEqDMap k fv) -> Bool
  has xk Nil = False
  has xk ((::) (hk ** _) t) = case decEq xk hk of
    Yes _ => True
    No _ => has xk t

export
nil : DecEq k => DecEqDMap k fv
nil = Nil

export
add : DecEq k => (xk : k) -> (fv xk) -> (m : DecEqDMap k fv) -> {auto 0 hasX : has xk m = False} -> DecEqDMap k fv
add xk xv m = (::) (xk ** xv) m

export
inside : (xk : k) -> (m : DecEqDMap k fv) -> Either (has xk m = False) (has xk m = True)
inside xk [] = Left Refl
inside xk ((hk ** _) :: t) with (decEq xk hk)
  inside hk ((hk ** _) :: t) | (Yes Refl) = Right Refl
  inside xk ((hk ** _) :: t) | (No _) = inside xk t

export
toList : DecEqDMap k fv -> List (k ** fv k)
toList Nil = []
toList (h :: t) = h :: toList t

export
rem : (xk : k) -> (m : DecEqDMap k fv) -> {auto 0 hasX : has xk m = True} -> DecEqDMap k fv
rem xk ((hk ** hv) :: t) with (decEq xk hk)
  rem hk ((hk ** hv) :: t) | (Yes Refl) = t
  rem xk ((hk ** hv) :: t) | (No contra) = (::) (hk ** hv) (rem xk t) {hasX = ?TODO4}

export
get : (xk : k) -> (m : DecEqDMap k fv) -> {auto 0 hasX : has xk m = True} -> fv xk
get xk ((hk ** hv) :: t) with (decEq xk hk)
  get hk ((hk ** hv) :: t) | (Yes Refl) = hv
  get xk ((hk ** hv) :: t) | (No contra) = get xk t

export
set : (xk : k) -> (fv xk) -> (m : DecEqDMap k fv) -> {auto 0 hasX : has xk m = True} -> DecEqDMap k fv
set xk xv ((hk ** hv) :: t) with (decEq xk hk)
  set hk xv ((hk ** hv) :: t) | (Yes Refl) = (::) (hk ** xv) t
  set xk xv ((hk ** hv) :: t) | (No contra) = (::) (hk ** hv) (set xk xv t) {hasX = ?TODO6}

export
mapValues :
  {0 k : Type} -> {0 fvx : k -> Type} -> {0 fvy : k -> Type} ->
  ((xk : k) -> fvx xk -> fvy xk) -> DecEqDMap k fvx -> DecEqDMap k fvy
mapValues f Nil = Nil
mapValues f ((::) (hk ** hv) t) = (::) (hk ** f hk hv) (mapValues f t) {hasX = ?TODO5}

0 proofAddHas : 
  DecEq k => (xk : k) -> (xv : fv xk) -> (m : DecEqDMap k fv) ->
  (hasX : has xk m = False) ->
  has xk (add xk xv m) = True

0 proofRemHas :
  DecEq k => (xk : k) -> (m : DecEqDMap k fv) ->
  (hasX : has xk m = True) ->
  has xk (rem xk m) = False

-- TODO
-- 0 proofAddGet :
--   DecEq k => (xk : k) -> (xv : fv xk) -> (m : DecEqDMap k fv) ->
--   (hasX : has xk m = False) ->
--   get xk (add xk xv m) = xv -- decEqSelfIsYes

-- TODO
-- 0 proofSetGet :
--   DecEq k => (xk : k) -> (xv : fv xk) -> (m : DecEqDMap k fv) ->
--   (hasX : has xk m = True) ->
--   get xk (set xk xv m) = xv

0 proofMapValuesId :
  {k : Type} -> {fv : k -> Type} ->
  (m : DecEqDMap k fv) ->
  mapValues (\xk => \xv => xv) m = m

-- TODO export helper
export
DecEqMap : (0 k : Type) -> (0 v : Type) -> Type
DecEqMap k v = DecEqDMap k (const v)

-- TODO export helper
export
DecEqSet : (0 k : Type) -> Type
DecEqSet k = DecEqDMap k (const ())


-- tests

ta : DecEqDMap Nat (const String)
ta = []

tb : DecEqDMap Nat (const String)
tb = [(1 ** "one")]

tc : DecEqDMap Nat (const String)
tc = [(1 ** "one"), (2 ** "two")]

td : DecEqDMap Nat (const String)
td = [(1 ** "one"), (3 ** "two"), (2 ** "two")]

te : DecEqDMap Nat (const String)
-- te = [(1 ** "one"), (2 ** "two"), (2 ** "two")] -- must not typecheck

