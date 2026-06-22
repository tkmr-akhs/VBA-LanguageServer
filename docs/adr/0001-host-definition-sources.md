# Host definition sources

The language server provides Excel object model intelligence from `HostDefinition`s. It will ship with a bundled catalog for immediate and portable behavior, use a cached catalog when available, and refresh from Excel COM asynchronously on Windows when Excel is installed. COM-discovered definitions take precedence because they match the user's installed Excel version, while bundled definitions remain the fallback so startup and tests do not depend on Excel or COM availability.
