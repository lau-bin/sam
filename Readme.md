# EasySAM

EasySAM is a minimal RxJS-powered library for implementing the SAM pattern in TypeScript and JavaScript applications.

SAM stands for:

- **S**tate
- **A**ction
- **M**odel

The goal is to keep state management predictable by separating:

- **actions** that express intent
- **model logic** that updates state
- **state logic** that decides what should happen next
- **views** that react to state changes

EasySAM uses **RxJS** to make state observation simple and composable.

---

## Why EasySAM?

EasySAM gives you a lightweight way to build reactive state models without introducing a large framework.

It is useful when you want:

- explicit action-driven state transitions
- controlled mutations
- reactive subscriptions to the whole model or individual properties
- support for async actions
- a SAM-style feedback loop through state logic

---

## Installation

```bash
npm install easysam rxjs

A tiny RxJS-based library for implementing SAM (State-Action-Model) in TypeScript.