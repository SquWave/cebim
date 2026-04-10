# Active Context

## Current Focus
- **Maintenance & Optimization**:
    - Dependency updates (React 19, Firebase 12).
    - Bug fixes (Asset cost calculation, Mobile inputs).
    - Code quality improvements (Refactoring, Transaction History cleanup).

## Recent Changes
- **Features Added**:
    - **Withholding Tax**: Optional 17.5% tax calculation for funds.
    - **Silver Support**: Added 'Gram Gümüş' and other precious metals.
    - **TradingView API**: Migrated BIST stock pricing logic from delayed Midas API to live TradingView Scanner.
    - **Transaction History**: Added manual delete capability for fixing data anomalies.
    - **Statistics**: Monthly P/L trends, Average holding period.
- **Documentation**:
    - Updated `README.md` with current feature set.
    - Updated `Memory Bank` to reflect current project state.

## Next Steps
- Monitor user feedback on new tax features.
- Potential future upgrades:
    - Tailwind CSS v4 migration (currently held back).
    - Advanced portfolio analytics.
    - Multi-currency deep support.

## Active Decisions
- **Dependencies**: Decided to stick with Tailwind v3.4 for now to avoid major migration overhead while updating all other packages to latest.
- **Data Consistency**: Implemented "period-aware" deletion to ensure cost basis remains accurate when removing transactions.
