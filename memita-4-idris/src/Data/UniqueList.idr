module Data.UniqueList

import Decidable.Equality

%default total

data InList : a -> List a -> Type where
  Here : InList x (x :: xs)
  There : InList x xs -> InList x (y :: xs)

Uninhabited (InList x []) where
  uninhabited _ impossible

data UniqueList : (a : Type) -> (0 l : List a) -> Type where
  Nil : UniqueList a []
  (::) : (x : a) -> (xs : UniqueList a l) -> {auto 0 prf : Not (InList x l)} -> UniqueList a (x :: l)

inList : DecEq a => (x : a) -> (xs : List a) -> Dec (InList x xs)
inList x [] = No absurd
inList x (y :: xs) with (decEq x y)
  inList y (y :: xs) | Yes Refl = Yes Here
  _ | No xNeqY = case inList x xs of
    Yes xInXs => Yes (There xInXs)
    No xNotInXs => No $ \xInYXs => case xInYXs of
      Here => xNeqY Refl
      There xInXs => xNotInXs xInXs

inUniqueList : DecEq a => (x : a) -> (xs : UniqueList a l) -> Dec (InList x l)
inUniqueList x Nil = No absurd
inUniqueList x ((::) y xs) with (decEq x y)
  inUniqueList y ((::) y xs) | Yes Refl = Yes Here
  _ | No xNeqY = case inUniqueList x xs of
    Yes xInXs => Yes (There xInXs)
    No xNotInXs => No $ \xInYXs => case xInYXs of
      Here => xNeqY Refl
      There xInXs => xNotInXs xInXs

x1 : UniqueList Nat []
x1 = Nil

x2 = case inUniqueList 1 x1 of
  Yes xInNil => Nothing
  No xx => Just $ 1 :: x1

