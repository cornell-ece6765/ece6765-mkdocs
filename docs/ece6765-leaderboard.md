Public Leaderboard
==========================================================================

This leaderboard shows the score that each group reports on the four
public traces. Staff update it once a day. Groups whose leaderboard score
rises six times earn a participation bonus. [Milestone
4](ece6765-project-m4.md#5-public-leaderboard) describes how to report a
score and which updates count.

!!! info "This leaderboard is not the contest ranking"

    This leaderboard is a good-faith effort to show where each group
    stands. It ranks the scores that groups report on the public traces,
    as of the last daily update. Only the hidden traces that staff run
    after the deadline decide the contest. After the deadline, staff rerun
    each group's latest update to check that its score is reproducible.

<div id="leaderboard" data-src="https://raw.githubusercontent.com/cornell-ece6765/ece6765-leaderboard/main/leaderboard.json">
Loading the leaderboard.
</div>

The score of a group on a trace is its speedup over the released M1
baseline (`m1-release`) on that trace, reduced for any loss of answer
quality ([Milestone 4, Section 4.3](ece6765-project-m4.md#43-contest-score)).
The overall score is the geometric mean of the four trace scores, so a large
quality loss on one trace lowers it sharply. The leaderboard ranks the groups
by the overall score and by the score on each trace. Only the overall score
decides which updates count toward the participation bonus. A group that
has not reported a score yet has a score of 0 and no rank.
