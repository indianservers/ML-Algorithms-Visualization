import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Fragment, useState } from "react";
import {
  getVisionLab,
  visionBackItem,
  visionBrandIcon,
  visionLabs,
  visionMenuGroups,
} from "../catalog";

const BrandIcon = visionBrandIcon;

const BackIcon = visionBackItem.icon;

export function ComputerVisionSidebar({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const active = getVisionLab(pathname);

  return (
    <>
      <button type="button" className="cv-menu-toggle" onClick={() => setOpen(true)} aria-label="Open computer vision menu">
        <Menu size={16} />
        Labs
      </button>
      {open ? <button type="button" className="cv-menu-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} /> : null}
      <aside className={open ? "cv-sidebar is-open" : "cv-sidebar"} aria-label="Computer Vision labs">
        <div className="cv-sidebar-brand">
          <span className="cv-sidebar-mark">
            <BrandIcon size={18} />
          </span>
          <span>
            <strong>Computer Vision</strong>
            <em>Studio</em>
          </span>
          <button type="button" className="cv-sidebar-close" onClick={() => setOpen(false)} aria-label="Close computer vision menu">
            <X size={16} />
          </button>
        </div>
        <nav className="cv-sidebar-nav">
          {visionLabs.map((lab, index) => {
            const Icon = lab.icon;
            const isActive = active?.id === lab.id;
            const prevGroup = index === 0 ? null : visionLabs[index - 1]?.group;
            const groupLabel = visionMenuGroups.find((group) => group.id === lab.group)?.label;
            return (
              <Fragment key={lab.id}>
                {lab.group !== prevGroup && groupLabel ? <p>{groupLabel}</p> : null}
                <NavLink
                  to={lab.route}
                  end={lab.route === "/ml/computer-vision"}
                  className={isActive ? "is-active" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={15} />
                  <span>{lab.label}</span>
                </NavLink>
              </Fragment>
            );
          })}
        </nav>
        <NavLink to={visionBackItem.route} className="cv-sidebar-back" onClick={() => setOpen(false)}>
          <BackIcon size={15} />
          {visionBackItem.label}
        </NavLink>
      </aside>
    </>
  );
}
