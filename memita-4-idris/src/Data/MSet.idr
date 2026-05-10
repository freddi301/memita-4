module Data.MSet

export
data MSet : Type -> Type where
  Empty : MSet a
  Entry : a -> MSet a -> MSet a

export
empty : Ord a => MSet a
empty = Empty

export
add : Ord a => a -> MSet a -> MSet a
add x Empty = Entry x Empty
add x (Entry y r) = case compare x y of
  LT => Entry x (Entry y r)
  EQ => Entry y r
  GT => Entry y (add x r)

export
has : Ord a => a -> MSet a -> Bool
has x Empty = False
has x (Entry y r) = case compare x y of
  LT => False
  EQ => True
  GT => has x r

export
rem : Ord a => a -> MSet a -> MSet a
rem x Empty = Empty
rem x (Entry y r) = case compare x y of
  LT => Entry y r
  EQ => r
  GT => Entry y (rem x r)

proofAddHas : Ord a => (x : a) -> (s : MSet a) -> has x (add x s) = True

proofRemHasNot : Ord a => (x : a) -> (s : MSet a) -> has x (rem x s) = False

export
toList : MSet a -> List a
toList Empty = []
toList (Entry x r) = x :: toList r