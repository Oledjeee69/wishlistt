import Link from "next/link";

export default function HomePage() {
  return (
    <section className="relative flex min-h-[calc(100vh-120px)] flex-col items-center justify-center px-4 py-12">
      {/* Декоративные элементы */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Главная карточка */}
        <div className="card-glow rounded-3xl bg-white/95 p-10 shadow-xl backdrop-blur-sm">
          {/* Иконка/эмодзи */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-4xl shadow-lg">
              🎁
            </div>
          </div>

          <h1 className="mb-4 text-center text-4xl font-bold text-amber-900 sm:text-5xl">
            Список желаний для вас и друзей
          </h1>
          
          <p className="mx-auto mb-8 max-w-xl text-center text-lg leading-relaxed text-stone-700">
            Создайте список подарков, поделитесь ссылкой — друзья смогут зарезервировать
            подарок или скинуться на большой. Именинник не узнает, кто что взял.
          </p>

          {/* Кнопки действий */}
          <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth/register"
              className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-center font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>✨</span>
                <span>Создать аккаунт</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
            
            <Link
              href="/auth/login"
              className="w-full rounded-2xl border-2 border-amber-300 bg-white px-8 py-4 text-center font-semibold text-amber-800 transition-all hover:border-amber-400 hover:bg-amber-50 hover:shadow-md sm:w-auto"
            >
              Войти
            </Link>
          </div>

          {/* Подсказка */}
          <div className="rounded-xl bg-amber-50/80 p-4 text-center text-sm text-stone-600">
            <span className="mr-2">💌</span>
            Вам прислали ссылку на вишлист? Откройте её в браузере — регистрация не нужна.
          </div>
        </div>

        {/* Дополнительные карточки с преимуществами */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-6 text-center backdrop-blur-sm">
            <div className="mb-2 text-3xl">🎯</div>
            <h3 className="mb-1 font-semibold text-amber-900">Просто</h3>
            <p className="text-xs text-stone-600">Создайте список за минуту</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-6 text-center backdrop-blur-sm">
            <div className="mb-2 text-3xl">🔒</div>
            <h3 className="mb-1 font-semibold text-amber-900">Секретно</h3>
            <p className="text-xs text-stone-600">Именинник не узнает, кто что взял</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-6 text-center backdrop-blur-sm">
            <div className="mb-2 text-3xl">💰</div>
            <h3 className="mb-1 font-semibold text-amber-900">Вместе</h3>
            <p className="text-xs text-stone-600">Скидывайтесь на дорогие подарки</p>
          </div>
        </div>
      </div>
    </section>
  );
}

