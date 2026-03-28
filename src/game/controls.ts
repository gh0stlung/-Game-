export class Controls {
  public moveVector = { x: 0, y: 0 };
  public lookVector = { x: 0, y: 0 };
  public isJumping = false;
  public isRunning = false;

  private leftTouchId: number | null = null;
  private rightTouchId: number | null = null;
  private leftTouchStart = { x: 0, y: 0 };
  private rightTouchLast = { x: 0, y: 0 };

  private joystickBase: HTMLDivElement;
  private joystickStick: HTMLDivElement;
  private jumpBtn: HTMLButtonElement;
  private runBtn: HTMLButtonElement;

  private keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
  private isMouseDown = false;
  private lastMousePos = { x: 0, y: 0 };

  private disposeHandlers: (() => void)[] = [];

  constructor(private container: HTMLElement) {
    this.joystickBase = document.createElement('div');
    this.joystickBase.style.cssText = 'position:absolute; width:120px; height:120px; background:rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3); border-radius:50%; display:none; pointer-events:none; transform:translate(-50%, -50%); z-index:10;';
    
    this.joystickStick = document.createElement('div');
    this.joystickStick.style.cssText = 'position:absolute; top:50%; left:50%; width:50px; height:50px; background:rgba(255,255,255,0.5); border-radius:50%; transform:translate(-50%, -50%); box-shadow: 0 4px 10px rgba(0,0,0,0.3);';
    this.joystickBase.appendChild(this.joystickStick);
    
    this.container.appendChild(this.joystickBase);

    this.jumpBtn = document.createElement('button');
    this.jumpBtn.innerText = 'JUMP';
    this.jumpBtn.style.cssText = 'position:absolute; bottom:30px; right:30px; width:70px; height:70px; background:rgba(255,255,255,0.2); border-radius:50%; color:white; border:2px solid rgba(255,255,255,0.4); font-weight:bold; z-index:10; user-select:none; touch-action:none; backdrop-filter: blur(4px);';
    this.container.appendChild(this.jumpBtn);

    this.runBtn = document.createElement('button');
    this.runBtn.innerText = 'RUN';
    this.runBtn.style.cssText = 'position:absolute; bottom:30px; right:120px; width:70px; height:70px; background:rgba(255,255,255,0.2); border-radius:50%; color:white; border:2px solid rgba(255,255,255,0.4); font-weight:bold; z-index:10; user-select:none; touch-action:none; backdrop-filter: blur(4px);';
    this.container.appendChild(this.runBtn);

    this.initTouch();
    this.initKeyboard();
    this.initMouse();
  }

  public consumeLook() {
    const look = { x: this.lookVector.x, y: this.lookVector.y };
    this.lookVector.x = 0;
    this.lookVector.y = 0;
    return look;
  }

  private initTouch() {
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        
        if (touch.target === this.jumpBtn) {
          this.isJumping = true;
          this.jumpBtn.style.background = 'rgba(255,255,255,0.5)';
          continue;
        }
        if (touch.target === this.runBtn) {
          this.isRunning = true;
          this.runBtn.style.background = 'rgba(255,255,255,0.5)';
          continue;
        }

        if (touch.clientX < window.innerWidth / 2 && this.leftTouchId === null) {
          this.leftTouchId = touch.identifier;
          this.leftTouchStart.x = touch.clientX;
          this.leftTouchStart.y = touch.clientY;
          
          this.joystickBase.style.display = 'block';
          this.joystickBase.style.left = touch.clientX + 'px';
          this.joystickBase.style.top = touch.clientY + 'px';
          this.joystickStick.style.transform = `translate(-50%, -50%)`;
        } else if (touch.clientX >= window.innerWidth / 2 && this.rightTouchId === null) {
          this.rightTouchId = touch.identifier;
          this.rightTouchLast.x = touch.clientX;
          this.rightTouchLast.y = touch.clientY;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        
        if (touch.identifier === this.leftTouchId) {
          const dx = touch.clientX - this.leftTouchStart.x;
          const dy = touch.clientY - this.leftTouchStart.y;
          const maxDist = 60;
          const distance = Math.min(maxDist, Math.sqrt(dx * dx + dy * dy));
          const angle = Math.atan2(dy, dx);
          
          const stickX = Math.cos(angle) * distance;
          const stickY = Math.sin(angle) * distance;
          
          this.joystickStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;
          
          this.moveVector.x = stickX / maxDist;
          this.moveVector.y = -stickY / maxDist;
        } else if (touch.identifier === this.rightTouchId) {
          const dx = touch.clientX - this.rightTouchLast.x;
          const dy = touch.clientY - this.rightTouchLast.y;
          
          this.lookVector.x += dx;
          this.lookVector.y += dy;
          
          this.rightTouchLast.x = touch.clientX;
          this.rightTouchLast.y = touch.clientY;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        
        if (touch.target === this.jumpBtn) {
          this.jumpBtn.style.background = 'rgba(255,255,255,0.2)';
        }
        if (touch.target === this.runBtn) {
          this.isRunning = false;
          this.runBtn.style.background = 'rgba(255,255,255,0.2)';
        }

        if (touch.identifier === this.leftTouchId) {
          this.leftTouchId = null;
          this.joystickBase.style.display = 'none';
          this.moveVector.x = 0;
          this.moveVector.y = 0;
        } else if (touch.identifier === this.rightTouchId) {
          this.rightTouchId = null;
        }
      }
    };

    this.container.addEventListener('touchstart', onTouchStart, { passive: false });
    this.container.addEventListener('touchmove', onTouchMove, { passive: false });
    this.container.addEventListener('touchend', onTouchEnd, { passive: false });
    this.container.addEventListener('touchcancel', onTouchEnd, { passive: false });

    this.disposeHandlers.push(() => {
      this.container.removeEventListener('touchstart', onTouchStart);
      this.container.removeEventListener('touchmove', onTouchMove);
      this.container.removeEventListener('touchend', onTouchEnd);
      this.container.removeEventListener('touchcancel', onTouchEnd);
    });
  }

  private initKeyboard() {
    const onKeyDown = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'KeyW': this.keys.w = true; break;
        case 'KeyA': this.keys.a = true; break;
        case 'KeyS': this.keys.s = true; break;
        case 'KeyD': this.keys.d = true; break;
        case 'ShiftLeft': this.keys.shift = true; break;
        case 'Space': this.isJumping = true; break;
      }
      this.updateMoveVector();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'KeyW': this.keys.w = false; break;
        case 'KeyA': this.keys.a = false; break;
        case 'KeyS': this.keys.s = false; break;
        case 'KeyD': this.keys.d = false; break;
        case 'ShiftLeft': this.keys.shift = false; break;
      }
      this.updateMoveVector();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    this.disposeHandlers.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    });
  }

  private updateMoveVector() {
    if (this.leftTouchId !== null) return;
    
    let x = 0;
    let y = 0;
    if (this.keys.w) y += 1;
    if (this.keys.s) y -= 1;
    if (this.keys.a) x -= 1;
    if (this.keys.d) x += 1;
    
    const length = Math.sqrt(x*x + y*y);
    if (length > 0) {
      x /= length;
      y /= length;
    }
    
    this.moveVector.x = x;
    this.moveVector.y = y;
    this.isRunning = this.keys.shift;
  }

  private initMouse() {
    const onMouseDown = (e: MouseEvent) => {
      if (e.target === this.jumpBtn || e.target === this.runBtn) return;
      this.isMouseDown = true;
      this.lastMousePos.x = e.clientX;
      this.lastMousePos.y = e.clientY;
    };
    const onMouseUp = () => {
      this.isMouseDown = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!this.isMouseDown) return;
      const dx = e.clientX - this.lastMousePos.x;
      const dy = e.clientY - this.lastMousePos.y;
      this.lookVector.x += dx;
      this.lookVector.y += dy;
      this.lastMousePos.x = e.clientX;
      this.lastMousePos.y = e.clientY;
    };

    this.container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    this.disposeHandlers.push(() => {
      this.container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    });
  }

  public dispose() {
    this.joystickBase.remove();
    this.jumpBtn.remove();
    this.runBtn.remove();
    this.disposeHandlers.forEach(h => h());
  }
}
