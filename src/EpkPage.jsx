import { PressKit } from "./App";

export default function EpkPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <PressKit standalone />
    </div>
  );
}
