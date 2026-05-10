module State

export
record State s a where
  constructor MkState
  run : s -> (s, a)

namespace State

  export
  (>>=) : State s a -> (a -> State s b) -> State s b
  (MkState run1) >>= f = MkState $ \s1 =>
    let (s2, a) = run1 s1 in
    let (MkState run2) = f a in
    run2 s2

  export
  (>>) : State s a -> State s b -> State s b
  m >> k = m >>= \_ => k

  export
  return : a -> State s a
  return x = MkState $ \s => (s, x)

  read : State s s
  read = MkState $ \s => (s, s)

  write : s -> State s ()
  write s = MkState $ \_ => (s, ())

  export
  readin : (s -> a) -> State s a
  readin f = MkState $ \s => (s, f s)

  export
  modify : (s -> s) -> State s s
  modify f = MkState $ \s =>
    let s' = f s in
    (s', s')