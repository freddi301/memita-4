module Control.DState

export
record DState sx sy v where
  constructor MS
  run : sx -> (sy, v)

namespace DState

  export
  (>>=) : DState sx sy vx -> (vx -> DState sy sz vy) -> DState sx sz vy
  (MS run1) >>= f = MS $ \s1 =>
    let (s2, a) = run1 s1 in
    let (MS run2) = f a in
    run2 s2

  export
  (>>) : DState sx sy vx -> DState sy sz vy -> DState sx sz vy
  m1 >> m2 = m1 >>= \_ => m2

  export
  pure : a -> DState sx sx a
  pure x = MS $ \s => (s, x)

  export
  read : DState sx sx sx
  read = MS $ \s => (s, s)

  export
  write : sy -> DState sx sy sy
  write s = MS $ \_ => (s, s)

  export
  select : (sx -> a) -> DState sx sx a
  select f = MS $ \s => (s, f s)

  export
  update : (sx -> sy) -> DState sx sy sy
  update f = MS $ \s => let s' = f s in (s', s')

