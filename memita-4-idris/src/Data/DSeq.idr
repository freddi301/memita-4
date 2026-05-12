module Data.DSeq

data GSeq : {ht : Type} -> {vt : Type} -> {init : vt} -> {track : ht -> vt -> vt} -> {v : vt} -> Type where
  Nil :
    {ht : Type} -> {vt : Type} -> {init : vt} -> {track : ht -> vt -> vt} ->
    GSeq {ht = ht} {vt = vt} {init = init} {track = track} {v = init}
  (::) :
    {ht : Type} -> {vt : Type} -> {init : vt} -> {track : ht -> vt -> vt} -> {v : vt} ->
    (h : ht) ->
    GSeq {ht = ht} {vt = vt} {init = init} {track = track} {v = v} ->
    GSeq {ht = ht} {vt = vt} {init = init} {track = track} {v = track h v}


-- list like
GList : Type -> Type
GList a = GSeq {ht = a} {vt = ()} {init = ()} {track = \_ => \_ => ()} {v = ()}
t1 : GList String
t1 = ["a", "b", "c"]

-- vector like
GVec : Type -> Nat -> Type
GVec a n = GSeq {ht = a} {vt = Nat} {init = Z} {track = \_ => \p => S p} {v = n}
t2 : GVec String 3
t2 = ["a", "b", "c"]

-- heterogenous list like
GHList : List Type -> Type
GHList l = GSeq {ht = (i : Type ** i)} {vt = List Type} {init = []} {track = \(i ** _) => \t => i :: t} {v = l}
t3 : GHList [String, Nat, Bool]
t3 = [(String ** "a"), (Nat ** 1), (Bool ** True)]
