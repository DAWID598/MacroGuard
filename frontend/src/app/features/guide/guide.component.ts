import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-guide',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatExpansionModule,
    MatTabsModule,
    MatChipsModule
  ],
  template: `
    <div class="guide-container">
      <!-- HERO HEADER -->
      <div class="hero-section">
        <div class="hero-badge">
          <mat-icon>school</mat-icon>
          <span>Baza Wiedzy & Przewodnik Krok po Kroku</span>
        </div>
        <h1>Jak działa odżywianie, kalorie i Twoje ciało?</h1>
        <p class="hero-subtitle">
          Bez skomplikowanego żargonu medycznego, bez głodówek i bez mitów.
          Oto prosta, ludzka instrukcja obsługi Twojego organizmu od A do Z.
        </p>
      </div>

      <!-- SZYBKIE WSKAZÓWKI / KLUCZOWE PUNKTY -->
      <div class="highlight-pills">
        <div class="pill-card">
          <div class="pill-icon kcal-icon">
            <mat-icon>local_fire_department</mat-icon>
          </div>
          <div class="pill-text">
            <strong>Kaloria to energia</strong>
            <span>Jesz mniej niż spalasz = chudniesz. Jesz więcej = tyjesz.</span>
          </div>
        </div>

        <div class="pill-card">
          <div class="pill-icon prot-icon">
            <mat-icon>fitness_center</mat-icon>
          </div>
          <div class="pill-text">
            <strong>Białko daje sytość</strong>
            <span>Chroni Twoje mięśnie i sprawia, że nie czujesz głodu.</span>
          </div>
        </div>

        <div class="pill-card">
          <div class="pill-icon carb-icon">
            <mat-icon>bolt</mat-icon>
          </div>
          <div class="pill-text">
            <strong>Węgle to nie wróg</strong>
            <span>To Twoja codzienna bateria dla mózgu i energii do życia.</span>
          </div>
        </div>

        <div class="pill-card">
          <div class="pill-icon fat-icon">
            <mat-icon>shield</mat-icon>
          </div>
          <div class="pill-text">
            <strong>Tłuszcz reguluje hormony</strong>
            <span>Jest niezbędny do zdrowia, ale pamiętaj: 1g = aż 9 kcal!</span>
          </div>
        </div>
      </div>

      <!-- GŁÓWNA TREŚĆ - ZAKŁADKI TEMATYCZNE -->
      <mat-card class="content-card" appearance="outlined">
        <mat-tab-group animationDuration="200ms" color="primary">
          
          <!-- ZAKŁADKA 1: KALORIE I BILANS -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">local_fire_department</mat-icon>
              1. Kalorie i Bilans (Podstawa)
            </ng-template>

            <div class="tab-body">
              <div class="article-intro">
                <h2>Czym w ogóle jest kaloria? Pomyśl o samochodzie 🚗</h2>
                <p>
                  Twoje ciało to niesamowita maszyna. Tak jak samochód potrzebuje benzyny, żeby jechać,
                  tak Twoje narządy, mięśnie i mózg potrzebują energii z jedzenia.
                  <strong>Kaloria (kcal)</strong> to po prostu miara tej energii.
                </p>
              </div>

              <div class="grid-2">
                <div class="concept-box bmr-box">
                  <div class="concept-header">
                    <mat-icon>bedtime</mat-icon>
                    <h3>BMR — Spalanie na leżąco (Podstawa)</h3>
                  </div>
                  <p>
                    Nawet gdybyś leżał cały dzień na kanapie i nie ruszał palcem, Twoje serce musi pompować krew,
                    płuca oddychać, a komórki się regenerować.
                  </p>
                  <div class="concept-note">
                    To około <strong>60-70% wszystkich kalorii</strong>, które zużywasz w ciągu doby!
                  </div>
                </div>

                <div class="concept-box tdee-box">
                  <div class="concept-header">
                    <mat-icon>directions_run</mat-icon>
                    <h3>TDEE — Całkowite Spalanie (Twój dzień)</h3>
                  </div>
                  <p>
                    To Twój <strong>BMR + każdy ruch w ciągu dnia</strong>: spacer z psem, praca, wejście po schodach,
                    sprzątanie, gestykulacja oraz ewentualny trening.
                  </p>
                  <div class="concept-note">
                    TDEE to Twoje <strong>„Zero Kaloryczne”</strong> — jesz tyle i Twoja waga ani drgnie.
                  </div>
                </div>
              </div>

              <div class="section-divider"></div>

              <h3>Trzy proste scenariusze — Fizyka, której nie da się oszukać:</h3>
              <div class="scenarios-grid">
                <div class="scenario-card deficit">
                  <div class="scenario-badge">🔻 DEFICYT KALORYCZNY</div>
                  <h4>Jesz mniej niż wynosi Twoje TDEE</h4>
                  <p>
                    Organizmowi brakuje paliwa z talerza, więc musi sięgnąć do swoich magazynów — spala nagromadzony tłuszcz.
                  </p>
                  <div class="scenario-result">Efekt: <strong>Chudniesz</strong></div>
                </div>

                <div class="scenario-card maintain">
                  <div class="scenario-badge">⏸️ ZERO KALORYCZNE</div>
                  <h4>Jesz dokładnie tyle, ile spala Twoje ciało</h4>
                  <p>
                    Podaż energii idealnie pokrywa bieżące zapotrzebowanie. Organizm nic nie odkłada i niczego nie dopala.
                  </p>
                  <div class="scenario-result">Efekt: <strong>Utrzymujesz wagę</strong></div>
                </div>

                <div class="scenario-card surplus">
                  <div class="scenario-badge">🔺 NADWYŻKA KALORYCZNA</div>
                  <h4>Jesz więcej niż wynosi Twoje TDEE</h4>
                  <p>
                    Nadmiar energii nie znika w powietrzu. Organizm odkłada go na zapas (tłuszcz lub buduje mięśnie przy treningu).
                  </p>
                  <div class="scenario-result">Efekt: <strong>Masa rośnie</strong></div>
                </div>
              </div>

              <div class="callout-box warning">
                <mat-icon>report_problem</mat-icon>
                <div>
                  <strong>Dlaczego głodówki (1000 kcal) to najgorszy błąd?</strong>
                  <p>
                    Gdy drastycznie utniesz kalorie, organizm włącza tryb przetrwania: czujesz zmęczenie, mózg zwalnia obroty,
                    spalasz mięśnie zamiast tłuszczu, a po kilku dniach rzucasz się na lodówkę (efekt jojo).
                    <strong>Najlepszy, zdrowy deficyt to zaledwie 300–500 kcal mniej niż TDEE!</strong>
                  </p>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- ZAKŁADKA 2: MAKROSKŁADNIKI (B/W/T) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">pie_chart</mat-icon>
              2. Makroskładniki (B/W/T)
            </ng-template>

            <div class="tab-body">
              <div class="article-intro">
                <h2>Czym różnią się kalorie? Trzej muszkieterowie jedzenia</h2>
                <p>
                  1000 kcal z pączków to nie to samo co 1000 kcal z piersi kurczaka z warzywami i oliwą.
                  Każde jedzenie na świecie składa się z 3 elementów: <strong>Białka</strong>, <strong>Węglowodanów</strong> i <strong>Tłuszczów</strong>.
                </p>
              </div>

              <!-- BIAŁKO -->
              <div class="macro-deep-card protein-accent">
                <div class="m-card-header">
                  <div class="m-badge">1g = 4 kcal</div>
                  <h3>🥩 Białko (B) — Cegiełki Budulcowe</h3>
                </div>
                <div class="m-card-content">
                  <div class="m-desc">
                    <p>
                      Białko buduje Twoje mięśnie, skórę, włosy, paznokcie oraz przeciwciała odpornościowe.
                    </p>
                    <ul>
                      <li><strong>Król sytości:</strong> Trawi się najdłużej, dzięki czemu po posiłku wysokobiałkowym nie masz ochoty podjadać przez 3-4 godziny.</li>
                      <li><strong>Chroni Twoją sylwetkę:</strong> Na redukcji sprawia, że tracisz czysty tłuszcz, a nie mięśnie.</li>
                      <li><strong>Efekt termiczny:</strong> Twoje ciało zużywa aż 20-30% energii z białka na sam proces jego strawienia!</li>
                    </ul>
                    <div class="sources-pill">
                      <strong>Gdzie szukać:</strong> Pierś z kurczaka/indyka, ryby (łosoś, tuńczyk, dorsz), jaja, skyr, twaróg, serek wiejski, tofu, strączki (soczewica, ciecierzyca).
                    </div>
                  </div>
                </div>
              </div>

              <!-- WĘGLOWODANY -->
              <div class="macro-deep-card carbs-accent">
                <div class="m-card-header">
                  <div class="m-badge">1g = 4 kcal</div>
                  <h3>🍚 Węglowodany (W) — Czysta Energia i Mózg</h3>
                </div>
                <div class="m-card-content">
                  <div class="m-desc">
                    <p>
                      Węglowodany to podstawowe paliwo dla Twoich mięśni podczas ruchu oraz jedyne paliwo dla czerwonych krwinek i mózgu.
                    </p>
                    <ul>
                      <li><strong>Złożone (Twoi sprzymierzeńcy):</strong> Kasze, płatki owsiane, ryż, ziemniaki, chleb razowy. Uwalniają energię powoli i zawierają mnóstwo błonnika.</li>
                      <li><strong>Proste (Z umiarem):</strong> Cukier, słodycze, napoje. Dają szybki wystrzał energii, po którym szybko następuje wilczy głód.</li>
                      <li><strong>Obalamy mit:</strong> Od samych węglowodanów się nie tyje! Ziemniaki czy ryż nie mają magicznej właściwości zamieniania się w tłuszcz — liczy się suma kalorii.</li>
                    </ul>
                    <div class="sources-pill">
                      <strong>Gdzie szukać:</strong> Płatki owsiane, ryż basmati/jaśminowy, kasza gryczana i bulgur, ziemniaki, bataty, owoce, pełnoziarniste pieczywo.
                    </div>
                  </div>
                </div>
              </div>

              <!-- TŁUSZCZE -->
              <div class="macro-deep-card fat-accent">
                <div class="m-card-header">
                  <div class="m-badge hot">1g = aż 9 kcal!</div>
                  <h3>🥑 Tłuszcze (T) — Hormony i Mózg</h3>
                </div>
                <div class="m-card-content">
                  <div class="m-desc">
                    <p>
                      Tłuszcz jest niezbędny do życia. Bez niego organizm nie potrafi produkować hormonów (np. testosteronu, estrogenów) ani wchłaniać witamin A, D, E, K.
                    </p>
                    <ul>
                      <li><strong>Nigdy nie schodź do zera:</strong> Diety beztłuszczowe niszczą gospodarkę hormonalną, powodują wypadanie włosów i przewlekłe zmęczenie.</li>
                      <li><strong>Uważaj na gramaturę:</strong> Ponieważ 1g tłuszczu ma aż 9 kcal (ponad dwukrotnie więcej niż białko czy węgle!), 1 łyżka oliwy „na oko” może mieć nawet 100 kcal!</li>
                    </ul>
                    <div class="sources-pill">
                      <strong>Gdzie szukać:</strong> Oliwa z oliwek Extra Virgin, orzechy włoskie, migdały, awokado, tłuste ryby morskie, nasiona chia, masło.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- ZAKŁADKA 3: JAK ZACZĄĆ W MACROGUARD -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">checklist</mat-icon>
              3. Instrukcja w 4 Krokach
            </ng-template>

            <div class="tab-body">
              <div class="article-intro">
                <h2>Jak korzystać z MacroGuard, żeby mieć pewne efekty?</h2>
                <p>Nie musisz zmieniać całego życia w jeden dzień. Wystarczą te 4 proste kroki:</p>
              </div>

              <div class="steps-flow">
                <div class="step-card">
                  <div class="step-num">1</div>
                  <div class="step-text">
                    <h3>Ustaw swoje cele w Kalkulatorze BMR/TDEE</h3>
                    <p>
                      Przejdź do zakładki <strong>Kalkulator BMR/TDEE</strong>. Wpisz swój wzrost, wagę, wiek i poziom aktywności.
                      Nasz system wyliczy Twoje dokładne zapotrzebowanie wg wzoru Mifflin-St Jeor i ustawi cel kalorii oraz makroskładników.
                    </p>
                    <a mat-stroked-button color="primary" routerLink="/calculator">
                      <mat-icon>calculate</mat-icon>
                      Otwórz Kalkulator
                    </a>
                  </div>
                </div>

                <div class="step-card">
                  <div class="step-num">2</div>
                  <div class="step-text">
                    <h3>Zaprzyjaźnij się ze zwykłą wagą kuchenną</h3>
                    <p>
                      To najważniejszy nawyk. Nie zgaduj "na oko", ile waży banan, pierś z kurczaka czy porcja ryżu.
                      Postaw talerz na wadze, wytaruj i zważ składniki przed zjedzeniem. Szczególnie odważaj oleje, masło i orzechy!
                    </p>
                  </div>
                </div>

                <div class="step-card">
                  <div class="step-num">3</div>
                  <div class="step-text">
                    <h3>Dodawaj posiłki do Dziennika (4 posiłki)</h3>
                    <p>
                      W Dzienniku masz 4 przejrzyste kategorie: <em>Śniadanie, Obiad, Przekąska i Kolacja</em>.
                      Kliknij przycisk „Dodaj”, znajdź produkt w naszej bazie (lub wpisz własny) i wpisz wagę w gramach.
                      Paski kalorii na bieżąco pokazują, ile paliwa zostało Ci do końca dnia.
                    </p>
                    <a mat-stroked-button color="primary" routerLink="/diary">
                      <mat-icon>menu_book</mat-icon>
                      Przejdź do Dziennika
                    </a>
                  </div>
                </div>

                <div class="step-card">
                  <div class="step-num">4</div>
                  <div class="step-text">
                    <h3>Nie masz pomysłu? Użyj Generatora AI 🤖</h3>
                    <p>
                      Stoisz w kuchni i nie wiesz, co ugotować, żeby zmieścić się w makro?
                      Kliknij przycisk <strong>„Nie masz pomysłu? Wygeneruj posiłek”</strong>.
                      AI skomponuje przepis pod Twoje pozostałe kalorie z gramaturami, a jednym kliknięciem dodasz go do Dziennika!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- ZAKŁADKA 4: MITY I NAJCZĘSTSZE BŁĘDY (FAQ) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">psychology_alt</mat-icon>
              4. Mity i FAQ
            </ng-template>

            <div class="tab-body">
              <div class="article-intro">
                <h2>Najczęstsze mity i pułapki dietetyczne</h2>
                <p>Kliknij na pytanie, aby poznać naukową i zdroworozsądkową odpowiedź:</p>
              </div>

              <mat-accordion multi class="myths-accordion">
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon color="warn">close</mat-icon>
                      <strong>Mit 1: „Nie wolno jeść po godzinie 18:00, bo wszystko pójdzie w tłuszcz!”</strong>
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="faq-content">
                    <p>
                      <strong>Fakt:</strong> Twój żołądek nie ma zegarka! Organizm nie przestaje spalać kalorii po 18:00 — serce bije, płuca pracują, a komórki się regenerują przez całą noc.
                      Liczy się <strong>całodobowy bilans kalorii</strong>. Jeśli Twoje zapotrzebowanie to 2200 kcal, a o 20:30 zjesz lekką kolację mieszczącą się w tym limicie, schudniesz dokładnie tak samo.
                    </p>
                    <p class="tip-p">
                      <em>Wskazówka: Zjedz kolację 2–3 godziny przed snem, żeby nie kłaść się z ciężkim brzuchem i dobrze się wyspać.</em>
                    </p>
                  </div>
                </mat-expansion-panel>

                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon color="warn">close</mat-icon>
                      <strong>Mit 2: „Wczoraj ważyłem 70 kg, a dzisiaj rano 71.5 kg! Przytyłem 1.5 kg tłuszczu w jedną noc?!”</strong>
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="faq-content">
                    <p>
                      <strong>Fakt:</strong> Żeby przytyć 1.5 kg czystego tłuszczu, musiałbyś zjeść w nadmiarze ponad <strong>10 000 kcal</strong> (czyli np. 20 tabliczek czekolady naraz!).
                    </p>
                    <p>
                      Wahania wagi z dnia na dzień o 1–2 kg to niemal w 100% <strong>woda i treść jelitowa</strong>. Woda zatrzymuje się w ciele po bardziej słonym posiłku, po węglowodanach, po ciężkim treningu (stan zapalny mięśni) lub ze stresu.
                    </p>
                    <p class="tip-p">
                      <em>Wskazówka: Waż się raz w tygodniu (zawsze rano, na czczo, po toalecie) lub wyciągaj średnią z całego tygodnia. Nie panikuj pojedynczym skokiem!</em>
                    </p>
                  </div>
                </mat-expansion-panel>

                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon color="warn">close</mat-icon>
                      <strong>Mit 3: „Muszę jeść w 100% idealnie i na zawsze pożegnać się z pizzą i lodami”</strong>
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="faq-content">
                    <p>
                      <strong>Fakt:</strong> Podejście „100% albo nic” to prosta droga do rzucenia diety po 2 tygodniach.
                    </p>
                    <p>
                      Zastosuj <strong>Złotą Zasadę 80/20</strong>:
                    </p>
                    <ul>
                      <li><strong>80% Twojej diety:</strong> Gęste odżywczo, nieprzetworzone jedzenie (mięso, ryby, jaja, warzywa, owoce, kasze, oliwa).</li>
                      <li><strong>20% Twojej diety:</strong> Miejsce na przyjemności, które lubisz (kawałek pizzy, lody, czekolada) — po prostu wliczone w Twoje dzienne kalorie!</li>
                    </ul>
                  </div>
                </mat-expansion-panel>

                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon color="warn">close</mat-icon>
                      <strong>Mit 4: „Owoce tuczą, bo mają cukier (fruktozę)”</strong>
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="faq-content">
                    <p>
                      <strong>Fakt:</strong> Nikt na świecie nie przytył od jedzenia jabłek czy truskawek.
                      Owoce to nie czysty cukier z cukierniczki — zawierają mnóstwo wody, błonnika, witamin i antyoksydantów.
                      Miska truskawek (300g) to zaledwie 96 kcal, a wypełnia żołądek na długi czas!
                    </p>
                  </div>
                </mat-expansion-panel>

                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      <mat-icon color="warn">close</mat-icon>
                      <strong>Mit 5: „Kardio to jedyny sposób na schudnięcie”</strong>
                    </mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="faq-content">
                    <p>
                      <strong>Fakt:</strong> Schudnąć można nawet bez uprawiania sportu — kluczem jest wyłącznie deficyt kaloryczny z jedzenia.
                      Bieganie czy rower są wspaniałe dla serca i zdrowia, ale batonika spalisz po 40 minutach potu. Znacznie łatwiej jest po prostu nie zjeść tych 300 kcal!
                    </p>
                    <p class="tip-p">
                      <em>Najlepsza kombinacja: Lekki deficyt kaloryczny + codzienne spacery (8–10 tys. kroków) + 2-3 treningi siłowe w tygodniu.</em>
                    </p>
                  </div>
                </mat-expansion-panel>
              </mat-accordion>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>

      <!-- STOPKA ZACHĘCAJĄCA DO DZIAŁANIA -->
      <div class="action-footer">
        <h3>Jesteś gotowy, by zacząć?</h3>
        <p>Wiedzę już masz. Teraz czas przekuć ją w nawyk i świetne samopoczucie!</p>
        <div class="action-buttons">
          <a mat-flat-button color="primary" routerLink="/calculator" class="cta-btn">
            <mat-icon>calculate</mat-icon>
            1. Oblicz swoje zapotrzebowanie
          </a>
          <a mat-stroked-button color="primary" routerLink="/diary" class="cta-btn">
            <mat-icon>menu_book</mat-icon>
            2. Wypełnij dzisiejszy Dziennik
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .guide-container {
      max-width: 1040px;
      margin: 0 auto;
      padding: 24px 16px 48px;
    }

    .hero-section {
      text-align: center;
      margin-bottom: 28px;

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #eef2ff;
        color: #4f46e5;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 4px 12px;
        border-radius: 14px;
        margin-bottom: 12px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }

      h1 {
        margin: 0 0 10px;
        font-size: 30px;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.25;
      }

      .hero-subtitle {
        margin: 0 auto;
        max-width: 680px;
        font-size: 15px;
        color: #64748b;
        line-height: 1.5;
      }
    }

    .highlight-pills {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 24px;

      @media (max-width: 860px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }

      .pill-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 14px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);

        .pill-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          &.kcal-icon { background: #fee2e2; color: #dc2626; }
          &.prot-icon { background: #dcfce7; color: #16a34a; }
          &.carb-icon { background: #fef3c7; color: #d97706; }
          &.fat-icon { background: #fce7f3; color: #db2777; }

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }

        .pill-text {
          display: flex;
          flex-direction: column;
          gap: 2px;

          strong {
            font-size: 13.5px;
            color: #1e293b;
          }

          span {
            font-size: 12px;
            color: #64748b;
            line-height: 1.35;
          }
        }
      }
    }

    .content-card {
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
      overflow: hidden;
    }

    .tab-icon {
      margin-right: 6px;
    }

    .tab-body {
      padding: 24px 20px 32px;

      .article-intro {
        margin-bottom: 22px;

        h2 {
          margin: 0 0 6px;
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }

        p {
          margin: 0;
          font-size: 14.5px;
          color: #475569;
          line-height: 1.5;
        }
      }
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }

      .concept-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 16px;

        .concept-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;

          mat-icon {
            color: #4f46e5;
          }

          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            color: #1e293b;
          }
        }

        p {
          margin: 0 0 10px;
          font-size: 13.5px;
          color: #475569;
          line-height: 1.45;
        }

        .concept-note {
          background: #eef2ff;
          color: #3730a3;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 500;
        }
      }
    }

    .scenarios-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin: 16px 0 24px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }

      .scenario-card {
        border-radius: 14px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        .scenario-badge {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        h4 {
          margin: 0 0 6px;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }

        p {
          margin: 0 0 12px;
          font-size: 13px;
          color: #475569;
          line-height: 1.4;
          flex: 1;
        }

        .scenario-result {
          font-size: 13px;
          padding: 6px 10px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.7);
        }

        &.deficit {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          .scenario-badge { color: #166534; }
          .scenario-result { color: #166534; }
        }

        &.maintain {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          .scenario-badge { color: #475569; }
          .scenario-result { color: #334155; }
        }

        &.surplus {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          .scenario-badge { color: #9a3412; }
          .scenario-result { color: #9a3412; }
        }
      }
    }

    .callout-box {
      display: flex;
      gap: 14px;
      padding: 16px 18px;
      border-radius: 14px;
      margin-top: 18px;

      mat-icon {
        flex-shrink: 0;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      strong {
        display: block;
        font-size: 14.5px;
        margin-bottom: 4px;
      }

      p {
        margin: 0;
        font-size: 13.5px;
        line-height: 1.45;
      }

      &.warning {
        background: #fffbeb;
        border: 1px solid #fde68a;
        color: #92400e;
        mat-icon { color: #d97706; }
      }
    }

    .macro-deep-card {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 16px;

      .m-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;

        h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
        }

        .m-badge {
          font-size: 12px;
          font-weight: 700;
          background: #f1f5f9;
          color: #334155;
          padding: 2px 8px;
          border-radius: 6px;

          &.hot {
            background: #fce7f3;
            color: #be185d;
          }
        }
      }

      .m-desc {
        p {
          margin: 0 0 10px;
          font-size: 14px;
          color: #334155;
          line-height: 1.45;
        }

        ul {
          margin: 0 0 12px;
          padding-left: 20px;

          li {
            font-size: 13.5px;
            color: #475569;
            margin-bottom: 6px;
            line-height: 1.4;
          }
        }

        .sources-pill {
          background: #f8fafc;
          border-left: 3px solid #4f46e5;
          padding: 8px 12px;
          border-radius: 0 8px 8px 0;
          font-size: 13px;
          color: #334155;
        }
      }

      &.protein-accent { border-left: 4px solid #16a34a; }
      &.carbs-accent { border-left: 4px solid #d97706; }
      &.fat-accent { border-left: 4px solid #db2777; }
    }

    .steps-flow {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .step-card {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 18px;

        .step-num {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #4f46e5;
          color: #ffffff;
          font-weight: 800;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .step-text {
          flex: 1;

          h3 {
            margin: 0 0 4px;
            font-size: 16.5px;
            font-weight: 700;
            color: #0f172a;
          }

          p {
            margin: 0 0 12px;
            font-size: 13.5px;
            color: #475569;
            line-height: 1.45;
          }

          a {
            border-radius: 8px;
            font-weight: 600;
          }
        }
      }
    }

    .myths-accordion {
      mat-expansion-panel {
        border-radius: 12px !important;
        margin-bottom: 10px;
        box-shadow: none !important;
        border: 1px solid #e2e8f0;

        mat-panel-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14.5px;
        }

        .faq-content {
          padding-top: 6px;

          p {
            margin: 0 0 8px;
            font-size: 13.5px;
            color: #334155;
            line-height: 1.5;
          }

          ul {
            margin: 0 0 10px;
            padding-left: 20px;
            font-size: 13.5px;
            color: #475569;

            li {
              margin-bottom: 4px;
            }
          }

          .tip-p {
            color: #4f46e5;
            font-size: 13px;
          }
        }
      }
    }

    .action-footer {
      text-align: center;
      margin-top: 36px;
      padding: 28px 20px;
      background: linear-gradient(135deg, #f0fdf4, #eef2ff);
      border-radius: 16px;
      border: 1px solid #cbd5e1;

      h3 {
        margin: 0 0 6px;
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
      }

      p {
        margin: 0 0 18px;
        color: #475569;
        font-size: 14.5px;
      }

      .action-buttons {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 12px;

        .cta-btn {
          border-radius: 10px;
          font-weight: 600;
          height: 42px;
          padding: 0 18px;
        }
      }
    }
  `]
})
export class GuideComponent {}

