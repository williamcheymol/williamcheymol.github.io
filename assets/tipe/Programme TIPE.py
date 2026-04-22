import numpy as np
import numpy.linalg as np_linalg
import random
import time


# ── Preliminaries ─────────────────────────────────────────────────────────────

def all_binary_lists(n):
    """
    Generate all binary lists of length n.

    Args:
        n (int): Length of the lists.

    Returns:
        list[list[int]]: All 2^n binary lists of length n.
    """
    if n == 1:
        return [[0], [1]]
    else:
        shorter = all_binary_lists(n - 1)
        result = []
        for seq in shorter:
            result.append(seq + [0])
            result.append(seq + [1])
        return result


def list_sum(lst):
    """
    Compute the sum of a list recursively.

    Args:
        lst (list[int]): Input list.

    Returns:
        int: Sum of all elements.
    """
    if lst == []:
        return 0
    elif len(lst) == 1:
        return lst[0]
    else:
        return lst[0] + list_sum(lst[1:])


# ── State space and adjacency matrix ──────────────────────────────────────────

def all_states(num_balls, max_height):
    """
    Generate all valid juggling states for b balls and max height h.

    A state is a binary vector of length h with exactly b ones,
    where position i indicates a ball landing in i+1 time steps.

    Args:
        num_balls (int): Number of balls b.
        max_height (int): Maximum throw height h.

    Returns:
        list[list[int]]: All C(h, b) valid states.
    """
    candidates = all_binary_lists(max_height)
    return [state for state in candidates if list_sum(state) == num_balls]


def next_state(state, throw):
    """
    Compute the next state after a given throw.

    Args:
        state (list[int]): Current juggling state.
        throw (int):       Throw height (0 = empty hand / no throw).

    Returns:
        tuple[list[int], int]: (next_state, throw) if valid, ([], throw) if invalid.
    """
    num_balls = list_sum(state)
    shifted = state[1:] + [0]

    if throw == 0:
        if list_sum(shifted) != num_balls:
            return [], throw        # no ball available — invalid
        return shifted, throw

    if shifted[throw - 1] == 1:
        return [], throw            # collision — throw impossible
    if list_sum(shifted) == num_balls:
        return [], throw            # no ball in hand to throw

    shifted[throw - 1] = 1
    return shifted, throw


def all_next_states(state):
    """
    Enumerate all valid next states reachable from a given state.

    Args:
        state (list[int]): Current juggling state.

    Returns:
        tuple[list[list[int]], list[str]]: (reachable_states, corresponding_throws).
    """
    reachable = []
    throws = []
    num_balls = list_sum(state)

    for throw in range(num_balls + 1):
        next_s, t = next_state(state, throw)
        if next_s != []:
            reachable.append(next_s)
            throws.append(str(t))

    return reachable, throws


def adjacency_matrix(num_balls, max_height):
    """
    Build the adjacency matrix of the juggling graph.

    Entry M[i][j] = 1 iff state i can transition to state j via a valid throw.
    Closed paths of length t in this graph correspond to juggling sequences of period t.

    Args:
        num_balls (int):  Number of balls b.
        max_height (int): Maximum throw height h.

    Returns:
        np.ndarray: Square adjacency matrix of size C(h, b) × C(h, b).
    """
    states = all_states(num_balls, max_height)
    n = len(states)
    matrix = []

    for state in states:
        row = [0] * n
        reachable, _ = all_next_states(state)
        for next_s in reachable:
            row[states.index(next_s)] = 1
        matrix.append(row)

    return np.array(matrix)


# ── Arithmetic utilities ───────────────────────────────────────────────────────

def divisors(k):
    """
    Return all proper divisors of k (excluding k itself).

    Args:
        k (int): Positive integer.

    Returns:
        list[int]: Proper divisors of k.
    """
    divs = []
    sqrt_k = int(k ** 0.5)
    for i in range(1, sqrt_k + 1):
        if k % i == 0:
            divs.append(i)
            if k // i != k and k // i not in divs:
                divs.append(k // i)
    return divs


# ── Matrix operations ──────────────────────────────────────────────────────────

def matrix_trace(M):
    """
    Compute the trace of a square matrix (sum of diagonal entries).

    Args:
        M (np.ndarray): Square matrix.

    Returns:
        int/float: Trace of M.
    """
    return sum(M[k, k] for k in range(M.shape[0]))


def matrix_power(M, n):
    """
    Compute the n-th power of a square matrix.

    Args:
        M (np.ndarray): Square matrix.
        n (int):        Exponent.

    Returns:
        np.ndarray: M^n.
    """
    return np_linalg.matrix_power(M, n)


# ── Sequence counting ──────────────────────────────────────────────────────────

def new_patterns(adj_matrix, max_period):
    """
    Count genuinely new juggling patterns at each period, removing sub-period repetitions.

    Uses the identity: γ(t) = tr(M^t) - Σ_{d | t, d < t} γ(d),
    where γ(t) counts sequences whose minimal period is exactly t.

    Args:
        adj_matrix (np.ndarray): Adjacency matrix of the juggling graph.
        max_period (int):        Maximum period to consider.

    Returns:
        list[int]: γ(t) for t in 1..max_period.
    """
    counts = []
    for period in range(1, max_period + 1):
        trace = matrix_trace(matrix_power(adj_matrix, period))
        for d in divisors(period):
            trace -= counts[d - 1]
        counts.append(trace)
    return counts


def num_patterns(adj_matrix, max_period):
    """
    Count all distinct juggling sequences up to a given period.

    Divides γ(t) by t to remove cyclic equivalents (rotations of the same sequence).

    Args:
        adj_matrix (np.ndarray): Adjacency matrix of the juggling graph.
        max_period (int):        Maximum period to consider.

    Returns:
        int: Total number of distinct sequences.
    """
    gamma = new_patterns(adj_matrix, max_period)
    return sum(int(gamma[t] / (t + 1)) for t in range(len(gamma)))


def all_patterns_count():
    """
    Count all distinct juggling sequences for b = 0..9, H = 10, t <= 10.

    Returns:
        int: Total sequence count (= 1,342,382).

    Example:
        >>> all_patterns_count()
        1342382
    """
    total = 0
    for num_balls in range(10):
        total += num_patterns(adjacency_matrix(num_balls, 10), 10)
    return total


# ── Full census (explicit enumeration) ────────────────────────────────────────

def expand_frontier(frontier_states, frontier_sequences):
    """
    Advance all partial sequences by one step, branching over all valid throws.

    Args:
        frontier_states    (list[list[int]]): Current states for each partial sequence.
        frontier_sequences (list[str]):       Accumulated throw strings so far.

    Returns:
        tuple[list[list[int]], list[str]]: Updated (states, sequences) after one step.
    """
    new_states = []
    new_sequences = []

    for idx in range(len(frontier_states)):
        reachable, throws = all_next_states(frontier_states[idx])
        new_states += reachable
        for throw in throws:
            new_sequences.append(frontier_sequences[idx] + throw)

    return new_states, new_sequences


def all_patterns(start_state, period):
    """
    Enumerate all juggling sequences of exactly the given period from a starting state.

    Args:
        start_state (list[int]): Initial juggling state.
        period (int):            Target sequence period.

    Returns:
        list[str]: All valid siteswap sequences of the given period starting and
                   ending at start_state.
    """
    states, sequences = all_next_states(start_state)

    for _ in range(period - 1):
        states, sequences = expand_frontier(states, sequences)

    return [sequences[k] for k in range(len(states)) if states[k] == start_state]


def census(num_balls, max_height, period):
    """
    Enumerate all juggling sequences of a given period across all starting states.

    Args:
        num_balls (int):  Number of balls b.
        max_height (int): Maximum throw height h.
        period (int):     Target sequence period t.

    Returns:
        list[str]: All valid siteswap sequences (may include cycles and repetitions).
    """
    result = []
    for state in all_states(num_balls, max_height):
        result += all_patterns(state, period)
    return result


def is_a_cycle(seq_a, seq_b):
    """
    Check whether seq_a is a cyclic rotation of seq_b.

    Args:
        seq_a (str): First sequence.
        seq_b (str): Second sequence.

    Returns:
        bool: True if seq_a is a rotation of seq_b.
    """
    return len(seq_a) == len(seq_b) and seq_b in (seq_a + seq_a)


def contains_cycle(pattern, seen_patterns):
    """
    Check whether pattern is a cyclic rotation of any already-seen sequence.

    Args:
        pattern (str):       Candidate sequence.
        seen_patterns (set): Set of previously accepted sequences.

    Returns:
        bool: True if pattern is a rotation of a known sequence.
    """
    return any(is_a_cycle(pattern, p) for p in seen_patterns)


def census_filtered(num_balls, max_height, period):
    """
    Enumerate all distinct juggling sequences, removing cyclic duplicates.

    Args:
        num_balls (int):  Number of balls b.
        max_height (int): Maximum throw height h.
        period (int):     Target sequence period t.

    Returns:
        list[str]: Unique siteswap sequences (up to rotation).
    """
    raw = census(num_balls, max_height, period)
    seen = set()
    unique = []

    for pattern in raw:
        if pattern not in seen and not contains_cycle(pattern, seen):
            unique.append(pattern)
            seen.add(pattern)

    return unique


def is_repetition(long_seq, short_seq):
    """
    Check whether long_seq is a repeated concatenation of short_seq.

    Args:
        long_seq (str):  Candidate repeated sequence.
        short_seq (str): Candidate base sequence.

    Returns:
        bool: True if long_seq == short_seq * k for some integer k.
    """
    if len(long_seq) % len(short_seq) == 0:
        return long_seq == (len(long_seq) // len(short_seq)) * short_seq
    return False


def not_a_repetition(seq, known_sequences):
    """
    Check whether seq is not a repetition of any sequence in known_sequences.

    Args:
        seq (str):              Candidate sequence.
        known_sequences (list): Previously accepted sequences.

    Returns:
        bool: True if seq is not a repetition of any known sequence.
    """
    return not any(is_repetition(seq, known) for known in known_sequences)


def census_up_to_period(num_balls, max_height, max_period):
    """
    Full census of all distinct juggling sequences up to a maximum period.

    Removes both cyclic rotations and period-repetitions. Assumes max_height is the
    global maximum — results include all sequences valid for smaller heights.

    Args:
        num_balls (int):   Number of balls b.
        max_height (int):  Maximum throw height H.
        max_period (int):  Maximum period N.

    Returns:
        tuple[list[str], int]: (all_unique_sequences, count).

    Example:
        >>> seqs, count = census_up_to_period(3, 5, 5)
        Execution time: 0.42 seconds
        >>> count
        42
    """
    all_sequences = []
    start = time.perf_counter()

    for period in range(1, max_period + 1):
        filtered = census_filtered(num_balls, max_height, period)
        all_sequences += [seq for seq in filtered if not_a_repetition(seq, all_sequences)]

    elapsed = time.perf_counter() - start
    print(f"Execution time: {elapsed:.2f} seconds")
    return all_sequences, len(all_sequences)


# ── Random sequence generator ──────────────────────────────────────────────────

def random_pattern(num_balls, max_height, period):
    """
    Return a uniformly random valid juggling sequence.

    Args:
        num_balls (int):  Number of balls b.
        max_height (int): Maximum throw height h.
        period (int):     Sequence period t.

    Returns:
        str: A random valid siteswap sequence.

    Example:
        >>> random_pattern(3, 5, 3)
        '234'
        >>> random_pattern(4, 6, 5)
        '06662'
    """
    sequences = census_filtered(num_balls, max_height, period)
    return sequences[random.randint(0, len(sequences) - 1)]
