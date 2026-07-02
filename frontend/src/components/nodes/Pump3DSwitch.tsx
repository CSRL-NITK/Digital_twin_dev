import React from 'react';
import styled from 'styled-components';

interface Pump3DSwitchProps {
  isOn: boolean;
  canControl?: boolean;
  onToggle?: () => void;
  scale?: number;
}

export const Pump3DSwitch: React.FC<Pump3DSwitchProps> = ({
  isOn,
  canControl = true,
  onToggle,
  scale = 0.38,
}) => {
  return (
    <StyledWrapper $scale={scale} $canControl={canControl}>
      <div
        className={`switch ${isOn ? 'is-checked' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (onToggle) {
            onToggle();
          }
        }}
        title={isOn ? 'Click switch to power OFF' : 'Click switch to power ON'}
      >
        <div className="button">
          <div className="light" />
          <div className="dots" />
          <div className="shadow" />
          <div className="characters" />
          <div className="shine" />
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div<{ $scale: number; $canControl: boolean }>`
  position: relative;
  transform: scale(${(props) => props.$scale});
  transform-origin: top left;
  user-select: none;
  cursor: pointer;
  pointer-events: auto;

  .switch {
    display: block;
    background-color: black;
    width: 150px;
    height: 195px;
    box-shadow: 0 0 10px 2px rgba(0, 0, 0, 0.4), 0 0 1px 2px black,
      inset 0 2px 2px -2px white, inset 0 0 2px 15px #47434c,
      inset 0 0 2px 22px black;
    border-radius: 8px;
    padding: 20px;
    perspective: 700px;
    cursor: pointer;
  }

  /* ── ON STATE (Checked - GREEN) ── */
  .switch.is-checked .button {
    transform: translateZ(20px) rotateX(25deg);
    box-shadow: 0 -10px 20px #1cff42;
    background: linear-gradient(
      #02961d 0%,
      #005e02 30%,
      #006300 70%,
      #009100 100%
    );
  }

  .switch.is-checked .button::before {
    background: linear-gradient(
          rgba(255, 255, 255, 0.8) 10%,
          rgba(255, 255, 255, 0.3) 30%,
          #055c00 75%,
          #022e00
        )
        50% 50%/97% 97%,
      #00b00f;
  }

  .switch.is-checked .button::after {
    background-image: linear-gradient(#006600, #003008);
  }

  .switch.is-checked .dots {
    background-image: radial-gradient(transparent 30%, rgba(6, 97, 0, 0.7) 70%);
  }

  .switch.is-checked .light {
    background-image: radial-gradient(#7dff83, #1bff17 40%, transparent 70%);
    animation: flicker 0.2s infinite 0.3s;
    opacity: 1;
  }

  .switch.is-checked .shine {
    opacity: 1;
  }

  .switch.is-checked .shadow {
    opacity: 0;
  }

  /* ── OFF STATE (Unchecked - DARK RED) ── */
  .switch:not(.is-checked) .button {
    transform: translateZ(20px) rotateX(-25deg);
    box-shadow: 0 10px 20px rgba(180, 0, 0, 0.4);
    background: linear-gradient(
      #780505 0%,
      #420101 30%,
      #520101 70%,
      #6e0303 100%
    );
  }

  .switch:not(.is-checked) .button::before {
    background: linear-gradient(
          rgba(255, 255, 255, 0.5) 10%,
          rgba(255, 255, 255, 0.15) 30%,
          #3d0000 75%,
          #1f0000
        )
        50% 50%/97% 97%,
      #820000;
  }

  .switch:not(.is-checked) .button::after {
    background-image: linear-gradient(#470000, #210002);
  }

  .switch:not(.is-checked) .dots {
    background-image: radial-gradient(transparent 30%, rgba(90, 0, 0, 0.85) 70%);
  }

  .switch:not(.is-checked) .light {
    background-image: radial-gradient(#d63c3c, #b80d0d 45%, transparent 75%);
    opacity: 0.18;
  }

  .switch:not(.is-checked) .shine {
    opacity: 0.3;
  }

  .switch:not(.is-checked) .shadow {
    opacity: 0.8;
  }

  /* ── Common Button Structure ── */
  .switch .button {
    display: block;
    transition: all 0.3s cubic-bezier(1, 0, 1, 1);
    transform-origin: center center -20px;
    transform-style: preserve-3d;
    height: 100%;
    position: relative;
    cursor: pointer;
    background-repeat: no-repeat;
  }

  .switch .button::before {
    content: "";
    width: 100%;
    height: 50px;
    transform-origin: top;
    transform: rotateX(-90deg);
    position: absolute;
    top: 0;
    background-repeat: no-repeat;
  }

  .switch .button::after {
    content: "";
    width: 100%;
    height: 50px;
    transform-origin: top;
    transform: translateY(50px) rotateX(-90deg);
    position: absolute;
    bottom: 0;
    box-shadow: 0 50px 8px 0px black, 0 80px 20px 0px rgba(0, 0, 0, 0.5);
  }

  .switch .light {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .switch .dots {
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: 10px 10px;
  }

  .switch .characters {
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(white, white) 50% 20%/5% 20%,
      radial-gradient(
          circle,
          transparent 50%,
          white 52%,
          white 70%,
          transparent 72%
        )
        50% 80%/33% 25%;
    background-repeat: no-repeat;
  }

  .switch .shine {
    transition: all 0.3s cubic-bezier(1, 0, 1, 1);
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(white, transparent 3%) 50% 50%/97% 97%,
      linear-gradient(
          rgba(255, 255, 255, 0.5),
          transparent 50%,
          transparent 80%,
          rgba(255, 255, 255, 0.5)
        )
        50% 50%/97% 97%;
    background-repeat: no-repeat;
  }

  .switch .shadow {
    transition: all 0.3s cubic-bezier(1, 0, 1, 1);
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(transparent 70%, rgba(0, 0, 0, 0.8));
    background-repeat: no-repeat;
  }

  @keyframes flicker {
    0% {
      opacity: 1;
    }

    80% {
      opacity: 0.8;
    }

    100% {
      opacity: 1;
    }
  }
`;
