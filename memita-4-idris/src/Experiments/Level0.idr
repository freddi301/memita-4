module Experiments.Level0

import Decidable.Equality

import Data.DecEqSet
import Data.DecEqMap

data AccountId = MakeAccountId Nat

DecEq AccountId where
  decEq (MakeAccountId n1) (MakeAccountId n2) with (decEq n1 n2)
    decEq (MakeAccountId n1) (MakeAccountId n1) | (Yes Refl) = Yes Refl
    decEq (MakeAccountId n1) (MakeAccountId n2) | (No contra) = No $ \Refl => contra Refl

State : Type
State = DecEqMap AccountId (DecEqSet AccountId)

addAccount : AccountId -> State -> Either String State
addAccount accountId state = case inside accountId state of
  Left _ => Right $ add (accountId, empty) state
  Right _ => Left "Account already exists"

remAccount : AccountId -> State -> Either String State
remAccount accountId state = case inside accountId state of
  Left _ => Left "Account does not exist"
  Right _ => Right $ rem accountId state

addContact : AccountId -> AccountId -> State -> Either String State
addContact accountId contactId state = case inside accountId state of
  Left _ => Left "Account does not exist"
  Right _ => let accountEntry = get accountId state in
    case inside contactId accountEntry of
      Right _ => Left "Contact already exists"
      Left _ => Right $ set accountId (add contactId accountEntry) state

remContact : AccountId -> AccountId -> State -> Either String State
remContact accountId contactId state = case inside accountId state of
  Left _ => Left "Account does not exist"
  Right _ => let accountEntry = get accountId state in
    case inside contactId accountEntry of
      Left _ => Left "Contact does not exist"
      Right _ => Right $ set accountId (rem contactId accountEntry) state

getAccounts : State -> List AccountId
getAccounts state = toList $ keys state

getContacts : AccountId -> State -> Either String (List AccountId)
getContacts accountId state = case inside accountId state of
  Left _ => Left "Account does not exist"
  Right _ => Right $ toList $ get accountId state