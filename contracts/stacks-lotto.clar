;; StacksLotto - On-Chain Lottery System
;; Built for Stacks Builder Challenge Week 2

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-enough-stx (err u101))
(define-constant err-lottery-not-active (err u102))
(define-constant err-already-drawn (err u103))
(define-constant err-not-winner (err u104))
(define-constant err-already-claimed (err u105))
(define-constant err-no-tickets (err u106))
(define-constant err-invalid-amount (err u107))
(define-constant err-min-players (err u108))

;; Ticket price: 0.1 STX = 100000 microSTX
(define-constant ticket-price u100000)
;; Owner fee: 5%
(define-constant owner-fee-percent u5)
;; Minimum players for draw
(define-constant min-players u2)

;; Data Variables
(define-data-var current-round uint u1)
(define-data-var prize-pool uint u0)
(define-data-var total-tickets uint u0)
(define-data-var lottery-active bool true)
(define-data-var last-winner (optional principal) none)
(define-data-var last-prize uint u0)
(define-data-var total-rounds uint u0)
(define-data-var total-distributed uint u0)

;; Data Maps
(define-map player-tickets { player: principal, round: uint } uint)
(define-map round-info uint {
    total-tickets: uint,
    prize-pool: uint,
    winner: (optional principal),
    winning-ticket: uint,
    claimed: bool,
    draw-block: uint
})
(define-map ticket-owners { round: uint, ticket-number: uint } principal)
(define-map player-stats principal {
    total-tickets: uint,
    total-wins: uint,
    total-won: uint,
    total-spent: uint
})

;; Read-only functions
(define-read-only (get-ticket-price)
    ticket-price
)

(define-read-only (get-current-round)
    (var-get current-round)
)

(define-read-only (get-prize-pool)
    (var-get prize-pool)
)

(define-read-only (get-total-tickets)
    (var-get total-tickets)
)

(define-read-only (is-lottery-active)
    (var-get lottery-active)
)

(define-read-only (get-last-winner)
    (var-get last-winner)
)

(define-read-only (get-last-prize)
    (var-get last-prize)
)

(define-read-only (get-player-tickets (player principal) (round uint))
    (default-to u0 (map-get? player-tickets { player: player, round: round }))
)

(define-read-only (get-round-info (round uint))
    (map-get? round-info round)
)

(define-read-only (get-player-stats (player principal))
    (default-to 
        { total-tickets: u0, total-wins: u0, total-won: u0, total-spent: u0 }
        (map-get? player-stats player)
    )
)

(define-read-only (get-lottery-stats)
    {
        current-round: (var-get current-round),
        prize-pool: (var-get prize-pool),
        total-tickets: (var-get total-tickets),
        is-active: (var-get lottery-active),
        last-winner: (var-get last-winner),
        last-prize: (var-get last-prize),
        total-rounds: (var-get total-rounds),
        total-distributed: (var-get total-distributed)
    }
)

;; Private functions
(define-private (update-player-stats (player principal) (tickets uint) (spent uint))
    (let (
        (current-stats (get-player-stats player))
    )
        (map-set player-stats player {
            total-tickets: (+ (get total-tickets current-stats) tickets),
            total-wins: (get total-wins current-stats),
            total-won: (get total-won current-stats),
            total-spent: (+ (get total-spent current-stats) spent)
        })
    )
)

(define-private (update-winner-stats (player principal) (prize uint))
    (let (
        (current-stats (get-player-stats player))
    )
        (map-set player-stats player {
            total-tickets: (get total-tickets current-stats),
            total-wins: (+ (get total-wins current-stats) u1),
            total-won: (+ (get total-won current-stats) prize),
            total-spent: (get total-spent current-stats)
        })
    )
)

;; Public functions

;; Buy a single ticket
(define-public (buy-ticket)
    (let (
        (round (var-get current-round))
        (current-ticket-count (var-get total-tickets))
        (new-ticket-number (+ current-ticket-count u1))
        (player-current-tickets (get-player-tickets tx-sender round))
    )
        ;; Check lottery is active
        (asserts! (var-get lottery-active) err-lottery-not-active)
        
        ;; Transfer STX to contract (Clarity 4: use as-contract?)
        (try! (stx-transfer? ticket-price tx-sender (as-contract? tx-sender)))
        
        ;; Update ticket tracking
        (map-set ticket-owners { round: round, ticket-number: new-ticket-number } tx-sender)
        (map-set player-tickets { player: tx-sender, round: round } (+ player-current-tickets u1))
        
        ;; Update global state
        (var-set total-tickets new-ticket-number)
        (var-set prize-pool (+ (var-get prize-pool) ticket-price))
        
        ;; Update player stats
        (update-player-stats tx-sender u1 ticket-price)
        
        ;; Print event for chainhook
        (print {
            event: "ticket-purchased",
            player: tx-sender,
            round: round,
            ticket-number: new-ticket-number,
            player-total-tickets: (+ player-current-tickets u1),
            prize-pool: (+ (var-get prize-pool) ticket-price),
            price: ticket-price
        })
        
        (ok new-ticket-number)
    )
)

;; Buy multiple tickets at once
(define-public (buy-tickets (amount uint))
    (let (
        (round (var-get current-round))
        (total-cost (* ticket-price amount))
        (current-ticket-count (var-get total-tickets))
        (player-current-tickets (get-player-tickets tx-sender round))
    )
        ;; Validate
        (asserts! (var-get lottery-active) err-lottery-not-active)
        (asserts! (> amount u0) err-invalid-amount)
        (asserts! (<= amount u100) err-invalid-amount) ;; Max 100 tickets per tx
        
        ;; Transfer STX to contract (Clarity 4: use as-contract?)
        (try! (stx-transfer? total-cost tx-sender (as-contract? tx-sender)))
        
        ;; Update player tickets
        (map-set player-tickets { player: tx-sender, round: round } (+ player-current-tickets amount))
        
        ;; Update global state
        (var-set total-tickets (+ current-ticket-count amount))
        (var-set prize-pool (+ (var-get prize-pool) total-cost))
        
        ;; Update player stats
        (update-player-stats tx-sender amount total-cost)
        
        ;; Print event for chainhook
        (print {
            event: "tickets-purchased",
            player: tx-sender,
            round: round,
            amount: amount,
            start-ticket: (+ current-ticket-count u1),
            end-ticket: (+ current-ticket-count amount),
            total-cost: total-cost,
            player-total-tickets: (+ player-current-tickets amount),
            prize-pool: (var-get prize-pool)
        })
        
        (ok { start: (+ current-ticket-count u1), end: (+ current-ticket-count amount) })
    )
)

;; Draw winner (can be called by anyone when conditions met)
(define-public (draw-winner)
    (let (
        (round (var-get current-round))
        (total (var-get total-tickets))
        (pool (var-get prize-pool))
        (owner-fee (/ (* pool owner-fee-percent) u100))
        (winner-prize (- pool owner-fee))
        ;; Simple pseudo-random using block info
        (random-seed (+ block-height (buff-to-uint-be (unwrap-panic (get-block-info? id-header-hash (- block-height u1))))))
        (winning-ticket (+ (mod random-seed total) u1))
        (winner (unwrap! (map-get? ticket-owners { round: round, ticket-number: winning-ticket }) err-no-tickets))
    )
        ;; Check conditions
        (asserts! (var-get lottery-active) err-lottery-not-active)
        (asserts! (>= total min-players) err-min-players)
        
        ;; Deactivate lottery during draw
        (var-set lottery-active false)
        
        ;; Transfer owner fee (from contract - Clarity 4: use as-contract?)
        (try! (as-contract? (stx-transfer? owner-fee tx-sender contract-owner)))
        
        ;; Transfer prize to winner (from contract - Clarity 4: use as-contract?)
        (try! (as-contract? (stx-transfer? winner-prize tx-sender winner)))
        
        ;; Update winner stats
        (update-winner-stats winner winner-prize)
        
        ;; Store round info
        (map-set round-info round {
            total-tickets: total,
            prize-pool: pool,
            winner: (some winner),
            winning-ticket: winning-ticket,
            claimed: true,
            draw-block: block-height
        })
        
        ;; Update state
        (var-set last-winner (some winner))
        (var-set last-prize winner-prize)
        (var-set total-rounds (+ (var-get total-rounds) u1))
        (var-set total-distributed (+ (var-get total-distributed) winner-prize))
        
        ;; Reset for next round
        (var-set current-round (+ round u1))
        (var-set prize-pool u0)
        (var-set total-tickets u0)
        (var-set lottery-active true)
        
        ;; Print event for chainhook
        (print {
            event: "winner-drawn",
            round: round,
            winner: winner,
            winning-ticket: winning-ticket,
            total-tickets: total,
            prize-pool: pool,
            winner-prize: winner-prize,
            owner-fee: owner-fee,
            draw-block: block-height
        })
        
        (ok { winner: winner, prize: winner-prize, ticket: winning-ticket })
    )
)

;; Emergency stop (owner only)
(define-public (pause-lottery)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set lottery-active false)
        (print { event: "lottery-paused", by: tx-sender })
        (ok true)
    )
)

;; Resume lottery (owner only)
(define-public (resume-lottery)
    (begin
        (asserts! (is-eq tx-sender contract-owner) err-owner-only)
        (var-set lottery-active true)
        (print { event: "lottery-resumed", by: tx-sender })
        (ok true)
    )
)

;; Quick play - buy 1 ticket in single action
(define-public (quick-play)
    (buy-ticket)
)

;; Lucky 5 - buy 5 tickets at once
(define-public (lucky-five)
    (buy-tickets u5)
)

;; Power play - buy 10 tickets
(define-public (power-play)
    (buy-tickets u10)
)

;; Mega play - buy 25 tickets
(define-public (mega-play)
    (buy-tickets u25)
)
