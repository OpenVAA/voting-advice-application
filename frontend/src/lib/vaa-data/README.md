# VAA-Data: the Voting Advice Application data model

## Classes

> This diagram is preliminary and does not contain all class properties.

```mermaid
---
title: VAAData class hierarchy
---
classDiagram
  direction TD

  %% CLASS DEFINITIONS

  namespace core {

    class CanUpdate {
      <<Interface>>
      CanUpdate parent
      onUpdate(boolean propagate) void
    }

    class Updatable {
      <<Abstract>>
      #Record~string, MaybeCollection~ children
      #int numTransactions
      #Array~UpdateHandler~ subscriptions
      CanUpdate|null parent
      update(Function transaction, boolean propagate = false) void
      subscribe(UpdateHandler handler) Unsubscriber
      unsubscribe(UpdateHandler handler) int
      onUpdate(boolean propagate) void
      reset() void
    }

    class DataAccessor~DataObjectData~ {
      <<Interface>>
      getters for all properties of DataObjectData
      all subclasses implement this for their own data type
    }


    class DataObject {
      <<Abstract>>
      #DataObjectData data
      DataRoot root
      findAncestor(Function test) CanUpdate?
    }

    class NamedObject {
      <<Abstract>>
    }

  }

  namespace root {
    class DataRoot {
    }
  }


  namespace objects_election {
    class Election {
    }
  }

  namespace objects_constituency {
    class ConstituencyCategory {
    }

    class Constituency {
    }
  }

  namespace objects_entities {
    class Entity {
      <<Abstract>>
    }

    class Candidate {
    }

    class Party {
    }

    class Answer~Value~ {
      <<Type>>
      Value value
      string? info
    }
  }

  namespace objects_nomination {
    class Nomination~Entity1, Entity2~ {
      Entity1 nominee
      Entity2 noinator
      string? electionSymbol
      int electionRound
    }
  }

  namespace objects_questions {
    class QuestionCategory {
    }

    class QuestionTemplate {
      May not be needed
    }

    class Question {
    }

    class MatchableQuestion {
    }
  }

  %% INHERITANCE

  Updatable <|.. CanUpdate
  Updatable <|-- DataRoot
  Updatable <|-- DataObject
  DataObject <|.. DataAccessor
  DataObject <|-- Nomination
  DataObject <|-- NamedObject
  NamedObject <|-- Election
  NamedObject <|-- ConstituencyCategory
  NamedObject <|-- Constituency
  NamedObject <|-- QuestionCategory
  NamedObject <|-- Question
  NamedObject <|-- Entity
  Entity <|-- Candidate
  Entity <|-- Party
  Question <|-- MatchableQuestion

  %% CHILDREN AND LINKAGES

  DataRoot .. Election : contains
  DataRoot .. Entity : contains subtypes of
  DataRoot .. QuestionCategory : contains
  Election .. ConstituencyCategory : contains
  ConstituencyCategory .. Constituency : contains
  Constituency .. Nomination : contains
  Nomination .. Entity : links to subtypes via DataRoot
  QuestionCategory .. Question : contains subtypes of
  Question .. QuestionTemplate : may link to
  Entity .. Answer : has

```
