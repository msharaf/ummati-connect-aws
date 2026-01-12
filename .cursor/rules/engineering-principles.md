# Engineering Principles (PRIORITY ORDER - Do Not Violate)

1. **KISS**: Simplest working solution; avoid cleverness.
2. **YAGNI**: Build only what's needed now; no speculative features/abstractions.
3. **Readability**: Clear naming + straightforward control flow beats "smart" code.
4. **SOLID** (as needed): Use SRP/DIP/ISP to improve testability and reduce coupling; don't force patterns.
5. **DRY** (applied correctly): Dedupe business rules/knowledge; allow small duplication if it improves clarity.

## Code Requirements

- **Small, single-purpose functions**; explicit types; explicit error handling
- **Validate inputs at boundaries** (API/routes/db writes). Fail fast with actionable errors
- **Security**: Least privilege; never log secrets; protect PII by default
- **Performance**: Avoid N+1 and unbounded queries; paginate/batch; avoid premature optimization

## Workflow (Required for Every Change)

1. Write a **brief plan (bullets)** before editing
2. Implement **minimal diff** that meets requirements. No "drive-by refactors"
3. Refactor only if it measurably improves clarity/testability; keep changes scoped
4. **Tests required**:
   - Unit tests for core logic
   - Integration tests for API/DB boundaries
5. Provide **exact commands** to run tests + lint/format
6. Provide a **short PR-style review summary**: what changed, why, and key edge cases

## Code Review Mindset (Self-Check)

- **Naming**: Would a new engineer understand this in 60 seconds?
- **Complexity**: Can any function/module be simplified?
- **Duplication**: Is there repeated business logic that should be centralized?
- **Boundaries**: Are inputs validated and errors explicit?
- **Tests**: Do they cover behavior (not implementation details)?
