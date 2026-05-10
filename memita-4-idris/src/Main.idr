module Main

import Data.MSet
import Data.MMap

import Data.AccountId

main : IO ()
main = putStrLn "Hello from Idris2!"

interface UserMutation (r : Type -> Type) where
  addAccount : (accountSecret: AccountSecret) -> r (Either String AccountId)
  removeAccount : (accountId: AccountId) -> r (Either String ())
  addContact : (accountId: AccountId) -> (contactId: AccountId) -> r (Either String ())
  removeContact : (accountId: AccountId) -> (contactId: AccountId) -> r (Either String ())

interface UserQuery (system : Type) where
  allAccounts : system -> List AccountId
  allContacts : AccountId -> system -> List AccountId

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

UserMutation SimpleSystemMutation where
  addAccount accountSecret sys =
    let accountId = from accountSecret in
    case get accountId sys.accounts of
      Just _ => (sys, Left "Already added")
      Nothing => ({ accounts $= set accountId (MkAccountEntry accountSecret empty) } sys, Right accountId)
  removeAccount accountId sys =
    case get accountId sys.accounts of
      Nothing => (sys, Left "Account not found")
      Just _ => ({ accounts $= rem accountId } sys, Right ())
  addContact accountId contactId sys =
    case get accountId sys.accounts of
      Nothing => (sys, Left "Account not found")
      Just accountEntry =>
        case has contactId accountEntry.contacts of
          True => (sys, Left "Contact already exists")
          False =>
            ({ accounts $= set accountId ({ contacts $= add contactId } accountEntry) } sys, Right ())
  removeContact accountId contactId sys =
    case get accountId sys.accounts of
      Nothing => (sys, Left "Account not found")
      Just accountEntry =>
        case has contactId accountEntry.contacts of
          False => (sys, Left "Contact not found")
          True =>
            ({ accounts $= set accountId ({ contacts $= rem contactId } accountEntry) } sys, Right ())

-- async mutation
-- async query
-- subscriptions over wire
-- persist
-- performance
-- embed typescript api
-- hyperswarm driver