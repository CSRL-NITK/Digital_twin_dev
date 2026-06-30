import { useId } from 'react';
import styled from 'styled-components';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

const Switch = ({ checked, onChange, label }: SwitchProps) => {
  const id = useId();
  return (
    <Container>
      {label && <LabelText htmlFor={id}>{label}</LabelText>}
      <StyledWrapper>
        <div className="switch-wrap">
          <input 
            className="switch-input" 
            aria-label="switch" 
            name="switch" 
            id={id} 
            type="checkbox" 
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          <label className="switch-label" htmlFor={id} />
          <span className="switch-marbles" />
        </div>
      </StyledWrapper>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
`;

const LabelText = styled.label`
  color: #fff;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
`;

const StyledWrapper = styled.div`
  /* Scale down the switch slightly to fit in a panel */
  transform: scale(0.35);
  transform-origin: right center;
  width: 48px; /* exact space the scaled switch will take */
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  
  .switch-wrap {
    z-index: 20;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    width: calc(var(--w-switch) + calc(var(--p) * 2));
    height: calc(var(--h-switch) + calc(var(--p) * 2));
    box-shadow: hsla(var(--pure-black), 0.25) 2px -5px 4px inset,
      hsla(var(--pure-black), 0.25) 0px 2px 5px -1px,
      hsla(var(--pure-black), 0.3) 0 1px 3px -1px,
      0 70px 40px -20px hsla(var(--pure-black), 0.2),
      hsla(var(--pure-black), 0.2) 0 0 0 1px inset;
    --round: 4rem;
    --pure-black: 0, 0%, 0%;
    --pure-white: 0, 0%, 100%;
    --scale-x: calc(1.35 * var(--round));
    --p: calc(calc(6.25 / 100) * var(--round));
    --checked: calc(100% - calc(var(--round) + var(--p)));
    --sz-marbles: calc(var(--w-switch) + calc(var(--p) * 2));
    --h-switch: calc(var(--round) + calc(var(--p) * 2));
    --w-switch: calc(calc(var(--round) * 2) + calc(var(--p) * 2));
    --bg-switch: var(--pure-black);
    --box: var(--pure-white);
  }

  .switch-wrap .switch-input {
    display: none;
    background: transparent none;
    visibility: hidden;
  }

  .switch-label {
    cursor: pointer;
    user-select: none;
    position: relative;
    z-index: 20;
    width: var(--w-switch);
    height: var(--h-switch);
    display: flex;
    align-items: center;
    justify-content: center;
    outline: none;
    background-color: hsl(var(--pure-white));
    border-radius: 9999px;
    border-width: 0px;
    transition: all linear 300ms;
    box-shadow: var(--shadow);
    --shadow: hsla(var(--pure-black), 0.4) 0 2px 4px,
      hsla(var(--pure-black), 0.3) 0 7px 13px -3px,
      hsla(var(--pure-black), 0.25) -2px -5px 4px inset,
      hsla(var(--pure-black), 0.2) 0 0 0 1px inset;
  }

  .switch-label::after {
    position: absolute;
    display: block;
    content: "";
    width: var(--round);
    height: var(--round);
    left: var(--p);
    border-radius: 9999px;
    background-color: hsl(0, 0%, 100%);
    will-change: left, width, margin, padding;
    box-shadow: var(--shadow);
    transition: left 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275),
      width 300ms ease, padding 300ms ease, margin 300ms ease,
      background-color 300ms ease, box-shadow 300ms linear;
  }

  .switch-input + .switch-label:active::after {
    width: var(--scale-x);
    --shadow: hsla(var(--pure-black), 0.4) 0 2px 4px,
      hsla(var(--pure-black), 0.3) 0 7px 13px -3px,
      hsla(var(--pure-black), 0.25) 0px -2px 8px 6px inset,
      hsla(var(--pure-black), 0.25) 0 0 0 1px inset;
  }

  .switch-input:checked + .switch-label {
    --shadow: hsla(var(--pure-black), 0.4) 0 2px 4px,
      hsla(var(--pure-black), 0.3) 0 7px 13px -3px,
      hsla(var(--pure-black), 0.25) 2px -5px 4px inset,
      hsla(var(--pure-black), 0.2) 0 0 0 1px inset;
    --bg-switch: var(--pure-white);
    --box: var(--pure-black);
  }

  .switch-input:checked + .switch-label::after {
    background: white linear-gradient(-45deg, #f8acff 0%, #696eff 100%);
    left: var(--checked);
  }

  .switch-input:checked + .switch-label:active::after {
    margin-left: calc(calc(var(--checked) - var(--scale-x)) - var(--p));
  }

  .switch-marbles {
    width: 100%;
    height: 100%;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 9999px;
  }

  .switch-marbles::after {
    height: var(--sz-marbles);
    width: var(--sz-marbles);
    z-index: 0;
    content: "";
    position: absolute;
    border-radius: 9999px;
  }

  .switch-marbles::before {
    content: "";
    height: var(--sz-marbles);
    width: var(--sz-marbles);
    position: absolute;
    border-radius: 9999px;
    z-index: -1;
    background-image: linear-gradient(-45deg, #f8acff 0%, #696eff);
    filter: blur(20px);
    opacity: 0.7;
    animation: rotate 4000ms linear running infinite;
  }

  @keyframes rotate {
    to {
      rotate: 360deg;
    }
  }
`;

export default Switch;
