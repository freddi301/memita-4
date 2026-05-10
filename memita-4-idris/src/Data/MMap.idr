module Data.MMap

import Data.MSet

export
data MMap : Type -> Type -> Type where
  Empty : MMap k v
  Entry : k -> v -> MMap k v -> MMap k v

export
empty : MMap k v
empty = Empty

export
set : Ord k => k -> v -> MMap k v -> MMap k v
set xk xv Empty = Entry xk xv Empty
set xk xv (Entry yk yv r) = case compare xk yk of
  LT => Entry xk xv (Entry yk yv r)
  EQ => Entry yk yv r
  GT => Entry yk yv (set xk xv r)

export
get : Ord k => k -> MMap k v -> Maybe v
get x Empty = Nothing
get x (Entry y v r) = case compare x y of
  LT => Nothing
  EQ => Just v
  GT => get x r

export
rem : Ord k => k -> MMap k v -> MMap k v
rem x Empty = Empty
rem x (Entry y v r) = case compare x y of
  LT => Entry y v r
  EQ => r
  GT => Entry y v (rem x r)

proofSetGet : Ord k => (x : k) -> (y : v) -> (s : MMap k v) -> get x (set x y s) = Just y

proofRemGetNot : Ord k => (x : k) -> (s : MMap k v) -> get x (rem x s) = Nothing

export
keys : Ord k => MMap k v -> MSet k
keys Empty = empty
keys (Entry k v r) = add k (keys r)