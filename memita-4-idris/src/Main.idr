module Main

import Data.MSet
import Data.MMap

import Data.AccountId
import AppInterface

main : IO ()
main = putStrLn "Hello from Idris2!"

record AccountEntry where
  constructor MkAccountEntry
  secret : AccountSecret
  contacts : MSet AccountId

record SimpleSystem where
  constructor MkSimpleSystem
  accounts : MMap AccountId AccountEntry

SimpleSystemQuery : Type -> Type
SimpleSystemQuery a = SimpleSystem -> a

SimpleSystemMutation : Type -> Type
SimpleSystemMutation a = SimpleSystem -> (SimpleSystem, a)

UserQuery SimpleSystemQuery where
  allAccounts sys = keys sys.accounts
  allContacts accountId sys =
    case get accountId sys.accounts of
      Nothing => Left "Account not found"
      Just accountEntry => Right $ accountEntry.contacts

UserMutation SimpleSystemMutation where
  addAccount accountSecret sys =
    let accountId = from accountSecret in
    case get accountId sys.accounts of
      Just _ => (sys, Left AccountAlreadyExists)
      Nothing => ({ accounts $= set accountId (MkAccountEntry accountSecret empty) } sys, Right accountId)
  removeAccount accountId sys =
    case get accountId sys.accounts of
      Nothing => (sys, Left AccountNotFound)
      Just _ => ({ accounts $= rem accountId } sys, Right ())
  addContact accountId contactId sys =
    case get accountId sys.accounts of
      Nothing => (sys, Left AddContactAccountNotFound)
      Just accountEntry =>
        case has contactId accountEntry.contacts of
          True => (sys, Left ContactAlreadyExists)
          False =>
            ({ accounts $= set accountId ({ contacts $= add contactId } accountEntry) } sys, Right ())
  removeContact accountId contactId sys =
    case get accountId sys.accounts of
      Nothing => (sys, Left RemoveContactAccountNotFound)
      Just accountEntry =>
        case has contactId accountEntry.contacts of
          False => (sys, Left ContactNotFound)
          True =>
            ({ accounts $= set accountId ({ contacts $= rem contactId } accountEntry) } sys, Right ())

-- async mutation
-- async query
-- subscriptions over wire
-- persist
-- performance
-- embed typescript api
-- hyperswarm driver