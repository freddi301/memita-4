This skill is for keeping code quality high.

There is a checklist to satisfy.

Only in the current opened file.

Interactively propose changes one by one from the checklist. And expect that i might answer yes/no or other details.

# Checklist

## Style props

Ensure the style prop follows the convention of style={[base, customization]}
The styles must be inline or from theme, not stylesheet

## Theme usage

Ensure that most styles come from the theme and not hardcoded.
If there is something hardcoded, propose refactoring to move it to the theme.
The spacing (margin, padding) for now are mostly hardcoded, but the goal si to move spacing into the theme, only propose refactor hardcoded spacing if it is already in the theme.

## Code duplication

Check for obvious code duplication, only follow import chain for one level.
The code is biased to composition to avoid hasty abstractions, so consider code as duplication only if it duplicates already existing abstractions.

## Code style

Prefer inlined code to prevent excessive indiretion
