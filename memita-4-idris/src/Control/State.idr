module Control.State

export
record State sx sy v where
  constructor MkState
  run : sx -> (sy, v)

namespace State

  export
  (>>=) : State sx sy vx -> (vx -> State sy sz vy) -> State sx sz vy
  (MkState run1) >>= f = MkState $ \s1 =>
    let (s2, a) = run1 s1 in
    let (MkState run2) = f a in
    run2 s2

  export
  (>>) : State sx sy vx -> State sy sz vy -> State sx sz vy
  m1 >> m2 = m1 >>= \_ => m2

  export
  return : a -> State sx sx a
  return x = MkState $ \s => (s, x)

  export
  read : State sx sx sx
  read = MkState $ \s => (s, s)

  export
  write : sy -> State sx sy sy
  write s = MkState $ \_ => (s, s)

  export
  readin : (sx -> a) -> State sx sx a
  readin f = MkState $ \s => (s, f s)

  export
  modify : (sx -> sy) -> State sx sy sy
  modify f = MkState $ \s => let s' = f s in (s', s')