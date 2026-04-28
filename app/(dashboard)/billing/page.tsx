"use client"

import { useState, useMemo } from "react"
import {
  X,
  CreditCard,
  Receipt,
  History,
  MapPin,
  Plus,
  Trash2,
  Check,
  Pencil,
  AlertCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface Card {
  id: string
  last4: string
  brand: string
  expiry: string
  isDefault: boolean
  cardholder: string
}

const COUNTRIES = [
  "United States",
  "United Arab Emirates",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "India",
  "Japan",
  "Singapore",
  "Brazil",
]

const STATES_BY_COUNTRY: Record<string, string[]> = {
  "United States": [
    "California",
    "New York",
    "Texas",
    "Florida",
    "Illinois",
    "Pennsylvania",
    "Ohio",
    "Georgia",
    "North Carolina",
    "Washington",
  ],
  "United Arab Emirates": [
    "Dubai",
    "Abu Dhabi",
    "Sharjah",
    "Ajman",
    "Umm Al Quwain",
    "Ras Al Khaimah",
    "Fujairah",
  ],
  "United Kingdom": [
    "Greater London",
    "West Midlands",
    "Greater Manchester",
    "West Yorkshire",
    "Kent",
    "Essex",
    "Hampshire",
  ],
}

export default function BillingPage() {
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)

  // States for Add Card Form
  const [newName, setNewName] = useState("")
  const [newNumber, setNewNumber] = useState("")
  const [newExpiry, setNewExpiry] = useState("")
  const [newCvc, setNewCvc] = useState("")

  // States for Edit Card Form
  const [editName, setEditName] = useState("")
  const [editExpiry, setEditExpiry] = useState("")
  const [editCvc, setEditCvc] = useState("")

  // States for Billing Modal
  const [selectedCountry, setSelectedCountry] = useState("United Arab Emirates")
  const [selectedState, setSelectedState] = useState("")

  const [cards, setCards] = useState<Card[]>([
    {
      id: "1",
      last4: "4242",
      brand: "visa",
      expiry: "12/24",
      isDefault: true,
      cardholder: "Jane Johnson",
    },
    {
      id: "2",
      last4: "5555",
      brand: "mastercard",
      expiry: "10/25",
      isDefault: false,
      cardholder: "Jane Johnson",
    },
  ])
  const router = useRouter()

  // Find default card for the top section
  const defaultCard = cards.find((c) => c.isDefault)

  // Validation logic
  const validateNumber = (num: string) => {
    const clean = num.replace(/\s/g, "")
    if (clean.length === 0) return null
    if (!/^\d+$/.test(clean)) return "Numbers only"
    if (clean.length !== 16) return "Must be 16 digits"
    return null
  }

  const validateExpiry = (exp: string) => {
    if (exp.length === 0) return null
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) return "Format MM/YY"
    return null
  }

  const validateCvc = (cvc: string) => {
    if (cvc.length === 0) return null
    if (!/^\d{3,4}$/.test(cvc)) return "3 digits"
    return null
  }

  const isAddFormValid = useMemo(() => {
    return (
      newName.trim().length > 0 &&
      validateNumber(newNumber) === null &&
      newNumber.length > 0 &&
      validateExpiry(newExpiry) === null &&
      newExpiry.length > 0 &&
      validateCvc(newCvc) === null &&
      newCvc.length > 0
    )
  }, [newName, newNumber, newExpiry, newCvc])

  const isEditFormValid = useMemo(() => {
    return (
      editName.trim().length > 0 &&
      validateExpiry(editExpiry) === null &&
      editExpiry.length > 0 &&
      validateCvc(editCvc) === null
    )
  }, [editName, editExpiry, editCvc])

  const sortedCards = [...cards].sort(
    (a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)
  )

  const handleSetDefault = (id: string) => {
    setCards(
      cards.map((card) => ({
        ...card,
        isDefault: card.id === id,
      }))
    )
  }

  const handleRemoveCard = (id: string) => {
    setCards(cards.filter((card) => card.id !== id))
  }

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAddFormValid) return

    const newCard: Card = {
      id: Math.random().toString(),
      last4: newNumber.replace(/\s/g, "").slice(-4),
      brand: "visa",
      expiry: newExpiry,
      isDefault: cards.length === 0,
      cardholder: newName,
    }
    setCards([...cards, newCard])
    setIsAddingCard(false)
    setNewName("")
    setNewNumber("")
    setNewExpiry("")
    setNewCvc("")
  }

  const startEditing = (card: Card) => {
    setEditingCardId(card.id)
    setEditName(card.cardholder)
    setEditExpiry(card.expiry)
    setEditCvc("")
  }

  const handleUpdateCard = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    if (!isEditFormValid) return

    setCards(
      cards.map((c) =>
        c.id === id ? { ...c, cardholder: editName, expiry: editExpiry } : c
      )
    )
    setEditingCardId(null)
  }

  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto">
      <div className="mx-auto w-full">
        {/* Title */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Billing & Subscription
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your plan, billing information and payment methods.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Plan Details Card */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="p-4 md:p-6">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="flex items-center gap-6">
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">
                      Plan details
                    </h4>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 sm:flex-row">
                  <button
                    onClick={() => router.push("/billing/cancel")}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 sm:w-auto"
                  >
                    Cancel Plan
                  </button>
                  <button
                    className="w-full cursor-pointer rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95 sm:w-auto"
                    onClick={() => router.push("/plans")}
                  >
                    Upgrade Plan
                  </button>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-x-4 gap-y-6 rounded-2xl bg-slate-50 p-6 text-center lg:grid-cols-6">
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Plan name
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    Pro plan
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Next Payment
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    $19.00
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Subscription
                  </p>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    $0.00/mo
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Billing Cycle
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    Monthly
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Payment Method
                  </p>
                  {defaultCard ? (
                    <div className="mt-1 flex items-center justify-center gap-1.5 text-sm font-bold text-slate-900">
                      <img
                        src={`/assets/${defaultCard.brand}.svg`}
                        className="h-3 w-auto"
                        alt={defaultCard.brand}
                      />
                      <span className="uppercase">{defaultCard.last4}</span>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm font-bold text-red-500">None</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Status
                  </p>
                  <div className="mt-1 flex justify-center">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Billing Information */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900">
                    Billing Information
                  </h3>
                </div>
                <button
                  onClick={() => setIsBillingModalOpen(true)}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-900">{selectedCountry}</p>
                <p className="text-sm text-slate-500">
                  {selectedState}
                  {selectedState && ", "}Tax ID: Not provided
                </p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-6 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h3 className="truncate font-bold text-slate-900">
                    Payment Methods
                  </h3>
                </div>
                {!isAddingCard && !editingCardId && (
                  <button
                    onClick={() => setIsAddingCard(true)}
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Card</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                )}
              </div>

              {isAddingCard ? (
                <div className="animate-in duration-300 fade-in slide-in-from-top-2">
                  <form onSubmit={handleAddCard} className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          placeholder="Jane Johnson"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                            Card Number
                          </label>
                          {validateNumber(newNumber) && (
                            <span className="flex items-center gap-1 text-right text-[10px] font-bold text-red-500">
                              <AlertCircle className="h-2.5 w-2.5" />
                              {validateNumber(newNumber)}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="4242 4242 4242 4242"
                          value={newNumber}
                          onChange={(e) => setNewNumber(e.target.value)}
                          required
                          className={`w-full rounded-xl border bg-slate-50/50 px-4 py-2 text-sm transition-all focus:bg-white focus:ring-4 focus:outline-none ${
                            validateNumber(newNumber)
                              ? "border-red-200 focus:border-red-500 focus:ring-red-500/10"
                              : "border-slate-200 focus:border-primary focus:ring-primary/10"
                          }`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                              Expiry
                            </label>
                            {validateExpiry(newExpiry) && (
                              <span className="flex items-center gap-1 text-right text-[10px] font-bold text-red-500">
                                {validateExpiry(newExpiry)}
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="MM / YY"
                            value={newExpiry}
                            onChange={(e) => setNewExpiry(e.target.value)}
                            required
                            className={`w-full rounded-xl border bg-slate-50/50 px-4 py-2 text-sm transition-all focus:bg-white focus:ring-4 focus:outline-none ${
                              validateExpiry(newExpiry)
                                ? "border-red-200 focus:border-red-500 focus:ring-red-500/10"
                                : "border-slate-200 focus:border-primary focus:ring-primary/10"
                            }`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                              CVC
                            </label>
                            {validateCvc(newCvc) && (
                              <span className="flex items-center gap-1 text-right text-[10px] font-bold text-red-500">
                                {validateCvc(newCvc)}
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            placeholder="123"
                            value={newCvc}
                            onChange={(e) => setNewCvc(e.target.value)}
                            required
                            className={`w-full rounded-xl border bg-slate-50/50 px-4 py-2 text-sm transition-all focus:bg-white focus:ring-4 focus:outline-none ${
                              validateCvc(newCvc)
                                ? "border-red-200 focus:border-red-500 focus:ring-red-500/10"
                                : "border-slate-200 focus:border-primary focus:ring-primary/10"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={!isAddFormValid}
                        className="flex-1 cursor-pointer rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Save Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCard(false)}
                        className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedCards.map((card) => (
                    <div key={card.id}>
                      {editingCardId === card.id ? (
                        <div className="animate-in rounded-2xl border border-primary/20 bg-primary/5 p-4 duration-300 fade-in slide-in-from-top-2">
                          <form
                            onSubmit={(e) => handleUpdateCard(e, card.id)}
                            className="space-y-4"
                          >
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                  Cardholder Name
                                </label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  required
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                      Expiry
                                    </label>
                                    {validateExpiry(editExpiry) && (
                                      <span className="flex items-center gap-1 text-right text-[10px] font-bold text-red-500">
                                        {validateExpiry(editExpiry)}
                                      </span>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    value={editExpiry}
                                    onChange={(e) =>
                                      setEditExpiry(e.target.value)
                                    }
                                    required
                                    className={`w-full rounded-xl border bg-white px-4 py-2 text-sm transition-all focus:ring-4 focus:outline-none ${
                                      validateExpiry(editExpiry)
                                        ? "border-red-200 focus:border-red-500 focus:ring-red-500/10"
                                        : "border-slate-200 focus:border-primary focus:ring-primary/10"
                                    }`}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                      CVC
                                    </label>
                                    {validateCvc(editCvc) && (
                                      <span className="flex items-center gap-1 text-right text-[10px] font-bold text-red-500">
                                        {validateCvc(editCvc)}
                                      </span>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="•••"
                                    value={editCvc}
                                    onChange={(e) => setEditCvc(e.target.value)}
                                    className={`w-full rounded-xl border bg-white px-4 py-2 text-sm transition-all focus:ring-4 focus:outline-none ${
                                      validateCvc(editCvc)
                                        ? "border-red-200 focus:border-red-500 focus:ring-red-500/10"
                                        : "border-slate-200 focus:border-primary focus:ring-primary/10"
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={!isEditFormValid}
                                className="flex-1 cursor-pointer rounded-xl bg-primary py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Update Card
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCardId(null)}
                                className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div
                          className={`group relative flex flex-col gap-4 rounded-2xl border p-4 transition-all sm:flex-row sm:items-center sm:justify-between ${
                            card.isDefault
                              ? "border-primary/20 bg-primary/5 ring-1 ring-primary/20"
                              : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-4">
                            <div className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-white shadow-sm">
                              <img
                                src={`/assets/${card.brand}.svg`}
                                className="h-6 w-auto"
                                alt={card.brand}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-xs font-bold text-slate-900 uppercase md:text-sm">
                                  {card.brand} •••• {card.last4}
                                </p>
                                {card.isDefault && (
                                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                    <Check className="h-2.5 w-2.5" />
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 md:text-xs">
                                Expires {card.expiry}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-1 border-t border-slate-100 pt-3 transition-opacity group-hover:opacity-100 sm:border-t-0 sm:pt-0 sm:opacity-0">
                            {!card.isDefault && (
                              <button
                                onClick={() => handleSetDefault(card.id)}
                                className="cursor-pointer rounded-lg p-2 text-slate-400 transition-all hover:bg-white hover:text-primary"
                                title="Set as Default"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => startEditing(card)}
                              className="cursor-pointer rounded-lg p-2 text-slate-400 transition-all hover:bg-white hover:text-primary"
                              title="Edit Card"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveCard(card.id)}
                              className="cursor-pointer rounded-lg p-2 text-slate-400 transition-all hover:bg-white hover:text-red-500"
                              title="Remove Card"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {cards.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-sm text-slate-400 italic">
                        No payment methods saved.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-slate-400" />
              <h3 className="font-bold text-slate-900">Billing History</h3>
            </div>
          </div>
          <div className="scrollbar-none w-full overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Invoice</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      Apr 24, 2026
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      INV-2026-004
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      $19.00
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Paid
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-sm font-bold text-primary hover:underline">
                        Download
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      Mar 24, 2026
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      INV-2026-003
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      $19.00
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Paid
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-sm font-bold text-primary hover:underline">
                        Download
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-slate-50/50 px-6 py-3 text-center">
            <button className="text-sm font-bold text-slate-500 hover:text-slate-900">
              View all invoices
            </button>
          </div>
        </div>
      </div>

      {/* Billing Information Modal */}
      {isBillingModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setIsBillingModalOpen(false)} // Click outside to close
        >
          <div
            className="w-full max-w-xl animate-in overflow-hidden rounded-3xl bg-white shadow-2xl duration-200 fade-in zoom-in"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-6 md:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Receipt className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Billing Information
                </h2>
              </div>
              <button
                onClick={() => setIsBillingModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-6 overflow-y-auto px-4 py-6 md:p-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    placeholder="Street address, P.O. box"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    placeholder="Apartment, suite, unit, building"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g.: Monsters Inc."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    Country
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => {
                        setSelectedCountry(e.target.value)
                        setSelectedState("")
                      }}
                      className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    State
                  </label>
                  {STATES_BY_COUNTRY[selectedCountry] ? (
                    <div className="relative">
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 focus:outline-none"
                      >
                        <option value="">Select State</option>
                        {STATES_BY_COUNTRY[selectedCountry].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                        <svg
                          className="h-4 w-4 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Your state"
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Your city"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                    ZIP / Postal Code
                  </label>
                  <input
                    type="text"
                    placeholder="Your ZIP code"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-8 py-6">
              <button
                onClick={() => setIsBillingModalOpen(false)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
              >
                Cancel
              </button>
              <button className="cursor-pointer rounded-xl bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
