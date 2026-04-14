type Props = {
  children: React.ReactNode
}

export default function Card({ children }: Props) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
      {children}
    </div>
  )
}