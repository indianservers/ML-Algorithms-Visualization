import { useLayoutEffect, useRef } from 'react';
/** Retains the single shared account control across learning routes. */
export function AccountControl() {
  const slot = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const control = document.getElementById('account-trigger');
    const parking = document.getElementById('account-parking');
    if (control && slot.current) slot.current.append(control);
    return () => { if (control && parking) parking.append(control); };
  }, []);
  return <div className="aimer-account-slot" ref={slot} />;
}
